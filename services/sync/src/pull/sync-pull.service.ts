import { Injectable } from '@nestjs/common';
import { SyncChangeRecord, SyncPullResponse } from '@pee/types';
import { SyncEntityRegistryService, SyncRow } from '../sync-entity-registry.service';

const PAGE_SIZE = 500;

@Injectable()
export class SyncPullService {
  constructor(private readonly registry: SyncEntityRegistryService) {}

  async pull(ownerId: string, since?: string): Promise<SyncPullResponse> {
    const sinceDate = since ? new Date(since) : new Date(0);
    const changes: SyncChangeRecord[] = [];
    let hasMore = false;
    let maxUpdatedAt: Date | null = null;

    for (const entity of this.registry.entities) {
      const rows: SyncRow[] = await entity.delegate.findMany({
        where: { ownerId, updatedAt: { gt: sinceDate } },
        orderBy: { updatedAt: 'asc' },
        take: PAGE_SIZE,
      });

      if (rows.length === PAGE_SIZE) {
        hasMore = true;
      }
      for (const row of rows) {
        changes.push(entity.toChangeRecord(row));
        if (!maxUpdatedAt || row.updatedAt > maxUpdatedAt) {
          maxUpdatedAt = row.updatedAt;
        }
      }
    }

    return {
      changes,
      cursor: (maxUpdatedAt ?? (since ? sinceDate : new Date())).toISOString(),
      hasMore,
    };
  }
}
