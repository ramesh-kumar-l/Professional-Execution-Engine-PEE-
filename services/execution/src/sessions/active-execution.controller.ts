import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { ActiveExecutionResponse } from '@pee/types';
import { ExecutionEventsService } from '../events/execution-events.service';

@UseGuards(JwtAuthGuard)
@Controller('execution')
export class ActiveExecutionController {
  constructor(private readonly executionEventsService: ExecutionEventsService) {}

  @Get('active')
  listActive(@CurrentUser() user: CurrentUserPayload): Promise<ActiveExecutionResponse[]> {
    return this.executionEventsService.listActiveSessions(user.id);
  }
}
