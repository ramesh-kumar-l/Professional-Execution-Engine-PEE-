import { Module } from '@nestjs/common';
import { PlanningModule } from '@pee/planning';
import { ExecutionEventsService } from './events/execution-events.service';
import { GoalActivityController } from './events/goal-activity.controller';
import { ActiveExecutionController } from './sessions/active-execution.controller';
import { TaskSessionsController } from './sessions/task-sessions.controller';
import { TaskSessionsService } from './sessions/task-sessions.service';

@Module({
  imports: [PlanningModule],
  controllers: [GoalActivityController, TaskSessionsController, ActiveExecutionController],
  providers: [ExecutionEventsService, TaskSessionsService],
  exports: [ExecutionEventsService, TaskSessionsService],
})
export class ExecutionModule {}
