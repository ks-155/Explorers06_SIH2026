import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { FollowUpsService } from './follow-ups.service';
import { ScheduleFollowUpDto } from './dto/schedule-followup.dto';
import { RespondFollowUpDto } from './dto/respond-followup.dto';

@ApiTags('Follow-Ups')
@ApiBearerAuth()
@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post('schedule')
  @Roles(Role.admin, Role.provider)
  @ApiOperation({ summary: 'Schedule a follow-up (3m/6m/12m/24m)' })
  schedule(
    @Body() dto: ScheduleFollowUpDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.followUpsService.schedule(dto, actor);
  }

  @Get('pending')
  @Roles(Role.trainee, Role.admin)
  @ApiOperation({ summary: 'Pending follow-ups for the logged-in trainee' })
  pending(@CurrentUser() actor: AuthenticatedUser) {
    const traineeId = actor.traineeId;
    if (!traineeId) {
      return [];
    }
    return this.followUpsService.pending(traineeId, actor);
  }

  @Post(':id/respond')
  @Roles(Role.trainee)
  @ApiOperation({ summary: 'Submit response to a follow-up' })
  respond(
    @Param('id') id: string,
    @Body() dto: RespondFollowUpDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.followUpsService.respond(id, dto, actor);
  }

  @Get('unreachable')
  @Roles(Role.admin, Role.provider)
  @ApiOperation({ summary: 'List follow-ups where all channels failed' })
  unreachable(@CurrentUser() actor: AuthenticatedUser) {
    return this.followUpsService.unreachable(actor);
  }

  @Post(':id/mark-failed')
  @Roles(Role.admin, Role.provider)
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark follow-up as failed and escalate channel' })
  markFailed(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.followUpsService.markFailed(id, actor);
  }
}
