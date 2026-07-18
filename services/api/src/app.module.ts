import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AIModule } from '@pee/ai';
import { AuthModule } from '@pee/auth';
import { PrismaModule } from '@pee/database';
import { ExecutionModule } from '@pee/execution';
import { PlanningModule } from '@pee/planning';
import { ProjectsModule } from '@pee/projects';
import { SyncModule } from '@pee/sync';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    PlanningModule,
    ExecutionModule,
    SyncModule,
    AIModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
