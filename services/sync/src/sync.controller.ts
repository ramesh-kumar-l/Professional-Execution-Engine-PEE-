import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { SyncPullResponse, SyncPushResponse } from '@pee/types';
import { SyncPullQueryDto } from './dto/sync-pull-query.dto';
import { SyncPushRequestDto } from './dto/sync-push-request.dto';
import { SyncPullService } from './pull/sync-pull.service';
import { SyncPushService } from './push/sync-push.service';

@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(
    private readonly pullService: SyncPullService,
    private readonly pushService: SyncPushService,
  ) {}

  @Post('pull')
  pull(@CurrentUser() user: CurrentUserPayload, @Body() query: SyncPullQueryDto): Promise<SyncPullResponse> {
    return this.pullService.pull(user.id, query.since);
  }

  @Post('push')
  push(@CurrentUser() user: CurrentUserPayload, @Body() request: SyncPushRequestDto): Promise<SyncPushResponse> {
    return this.pushService.push(user.id, request);
  }
}
