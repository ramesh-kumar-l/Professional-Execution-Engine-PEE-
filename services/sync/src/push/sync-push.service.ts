import { Injectable } from '@nestjs/common';
import { SyncPushChange, SyncPushRequest, SyncPushResponse, SyncPushResult } from '@pee/types';
import { SyncEntityDefinition, SyncEntityRegistryService, SyncRow } from '../sync-entity-registry.service';
import { validatePayload } from './validate-payload';

@Injectable()
export class SyncPushService {
  constructor(private readonly registry: SyncEntityRegistryService) {}

  async push(ownerId: string, request: SyncPushRequest): Promise<SyncPushResponse> {
    const results: SyncPushResult[] = [];
    for (const change of request.changes) {
      results.push(await this.applyChange(ownerId, change));
    }
    return { results };
  }

  private async applyChange(ownerId: string, change: SyncPushChange): Promise<SyncPushResult> {
    const entity = this.registry.find(change.entity);
    if (!entity) {
      return { entity: change.entity, id: change.id, status: 'rejected', reason: 'unknown_entity' };
    }

    const payload = await validatePayload(entity.payloadClass, change.data);
    if (!payload) {
      return { entity: change.entity, id: change.id, status: 'rejected', reason: 'invalid_payload' };
    }

    const clientUpdatedAt = new Date(change.clientUpdatedAt);
    const existing = await entity.delegate.findUnique({ where: { id: change.id } });

    if (!existing) {
      try {
        await entity.applyCreate(ownerId, change.id, payload, clientUpdatedAt);
        return { entity: change.entity, id: change.id, status: 'applied' };
      } catch (error) {
        return { entity: change.entity, id: change.id, status: 'rejected', reason: this.reasonFrom(error) };
      }
    }

    if (existing.ownerId !== ownerId) {
      // Never reveal another owner's row exists — same 404-shaped rejection as every other cross-owner access.
      return { entity: change.entity, id: change.id, status: 'rejected', reason: 'not_found' };
    }

    if (change.clientVersion === existing.version && (await this.guardedTouch(entity, change.id, ownerId, existing.version))) {
      await entity.applyUpdate(ownerId, change.id, payload, clientUpdatedAt);
      return { entity: change.entity, id: change.id, status: 'applied' };
    }

    // Version mismatch, or another push won the optimistic-lock race above — resolve by last-write-wins.
    const fresh = (await entity.delegate.findUnique({ where: { id: change.id } })) as SyncRow;
    const clientIsNewer = clientUpdatedAt.getTime() > fresh.updatedAt.getTime();
    if (clientIsNewer && (await this.guardedTouch(entity, change.id, ownerId, fresh.version))) {
      await entity.applyUpdate(ownerId, change.id, payload, clientUpdatedAt);
      return { entity: change.entity, id: change.id, status: 'applied' };
    }

    return { entity: change.entity, id: change.id, status: 'conflict', serverRecord: entity.toChangeRecord(fresh) };
  }

  /** Atomic optimistic-lock claim: succeeds only if the row is still at `expectedVersion`. */
  private async guardedTouch(
    entity: SyncEntityDefinition,
    id: string,
    ownerId: string,
    expectedVersion: number,
  ): Promise<boolean> {
    const result = await entity.delegate.updateMany({
      where: { id, ownerId, version: expectedVersion },
      data: { version: { increment: 1 } },
    });
    return result.count === 1;
  }

  private reasonFrom(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown_error';
  }
}
