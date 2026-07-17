import { Module } from '@nestjs/common';
import { ProjectsModule } from '@pee/projects';
import { GoalsController } from './goals/goals.controller';
import { GoalsService } from './goals/goals.service';
import { ProjectGoalsController } from './goals/project-goals.controller';
import { GoalTasksController } from './tasks/goal-tasks.controller';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

@Module({
  imports: [ProjectsModule],
  controllers: [ProjectGoalsController, GoalsController, GoalTasksController, TasksController],
  providers: [GoalsService, TasksService],
  exports: [GoalsService, TasksService],
})
export class PlanningModule {}
