import { Module } from '@nestjs/common';
import { PlanningModule } from '@pee/planning';
import { ProjectsModule } from '@pee/projects';
import { SyncPullService } from './pull/sync-pull.service';
import { SyncPushService } from './push/sync-push.service';
import { SyncController } from './sync.controller';
import { SyncEntityRegistryService } from './sync-entity-registry.service';

@Module({
  imports: [ProjectsModule, PlanningModule],
  controllers: [SyncController],
  providers: [SyncEntityRegistryService, SyncPullService, SyncPushService],
})
export class SyncModule {}
