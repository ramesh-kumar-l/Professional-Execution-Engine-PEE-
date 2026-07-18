import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AIModule } from '@pee/ai';
import { AnalyticsModule } from '@pee/analytics';
import { AuthModule } from '@pee/auth';
import { PrismaModule } from '@pee/database';
import { ExecutionModule } from '@pee/execution';
import { LoggingModule, RequestIdMiddleware } from '@pee/logging';
import { OrganizationsModule } from '@pee/organizations';
import { PlanningModule } from '@pee/planning';
import { ProjectsModule } from '@pee/projects';
import { SyncModule } from '@pee/sync';
import { envValidationSchema } from './env.validation';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    LoggingModule,
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    ProjectsModule,
    PlanningModule,
    ExecutionModule,
    SyncModule,
    AIModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
