import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FollowUpStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ScheduleFollowUpDto } from './dto/schedule-followup.dto';
import { RespondFollowUpDto } from './dto/respond-followup.dto';

@Injectable()
export class FollowUpsService {
  private readonly logger = new Logger(FollowUpsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async schedule(dto: ScheduleFollowUpDto, actor: AuthenticatedUser) {
    const trainee = await this.prisma.trainee.findUnique({
      where: { id: dto.trainee_id },
    });
    if (!trainee) {
      throw new NotFoundException(`Trainee ${dto.trainee_id} not found`);
    }

    if (dto.employment_id) {
      const emp = await this.prisma.employmentRecord.findUnique({
        where: { id: dto.employment_id },
      });
      if (!emp) {
        throw new NotFoundException(
          `Employment record ${dto.employment_id} not found`,
        );
      }
    }

    const followUp = await this.prisma.followUp.create({
      data: {
        trainee_id: dto.trainee_id,
        employment_id: dto.employment_id ?? null,
        months_after_training: dto.months_after_training,
        channel: dto.channel ?? 'whatsapp',
        follow_up_date: dto.follow_up_date
          ? new Date(dto.follow_up_date)
          : new Date(),
        status: FollowUpStatus.scheduled,
        questions: dto.questions
          ? (dto.questions as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        responses: Prisma.JsonNull,
      },
    });

    await this.audit.record({
      actor,
      action: 'followup.schedule',
      entityType: 'follow_up',
      entityId: followUp.id,
      newValue: {
        trainee_id: dto.trainee_id,
        months: dto.months_after_training,
        channel: followUp.channel,
      },
    });

    this.logger.log(
      `Follow-up scheduled: ${followUp.id} (${followUp.channel})`,
    );
    return followUp;
  }

  /** Responding is trainee-only, scoped via JWT traineeId. */
  async respond(
    id: string,
    dto: RespondFollowUpDto,
    requester: AuthenticatedUser,
  ) {
    const followUp = await this.getFollowUpOrThrow(id);
    this.assertOwnerOrAdmin(followUp.trainee_id, requester);

    if (
      followUp.status !== FollowUpStatus.scheduled &&
      followUp.status !== FollowUpStatus.sent
    ) {
      throw new BadRequestException(
        `Follow-up ${id} is already ${followUp.status}; only scheduled/sent follow-ups can be responded to`,
      );
    }

    const updated = await this.prisma.followUp.update({
      where: { id },
      data: {
        responses: dto.responses as Prisma.InputJsonValue,
        non_placement_reason: dto.non_placement_reason ?? null,
        response_time_seconds: dto.response_time_seconds,
        status: FollowUpStatus.responded,
      },
    });

    await this.audit.record({
      actor: requester,
      action: 'followup.respond',
      entityType: 'follow_up',
      entityId: id,
      oldValue: { status: followUp.status },
      newValue: { status: FollowUpStatus.responded },
    });

    this.logger.log(
      `Follow-up ${id} responded (${dto.response_time_seconds}s)`,
    );
    return updated;
  }

  /** Pending follow-ups for a trainee (scoped by JWT). */
  async pending(traineeId: string, requester: AuthenticatedUser) {
    this.assertOwnerOrAdmin(traineeId, requester);

    return this.prisma.followUp.findMany({
      where: {
        trainee_id: traineeId,
        status: { in: [FollowUpStatus.scheduled, FollowUpStatus.sent] },
      },
      orderBy: { follow_up_date: 'asc' },
    });
  }

  /** Admin/provider: list all unreachable (all channels failed or timed out). */
  async unreachable(requester: AuthenticatedUser) {
    this.assertAdminOrProvider(requester);

    return this.prisma.followUp.findMany({
      where: {
        status: FollowUpStatus.failed,
      },
      include: {
        trainee: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { follow_up_date: 'asc' },
    });
  }

  private async getFollowUpOrThrow(id: string) {
    const followUp = await this.prisma.followUp.findUnique({ where: { id } });
    if (!followUp) {
      throw new NotFoundException(`Follow-up ${id} not found`);
    }
    return followUp;
  }

  private assertOwnerOrAdmin(traineeId: string, requester: AuthenticatedUser) {
    const isAdmin = requester.role === 'admin';
    const isOwner =
      requester.role === 'trainee' && requester.traineeId === traineeId;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You can only access follow-ups for your own trainee profile',
      );
    }
  }

  private assertAdminOrProvider(requester: AuthenticatedUser) {
    if (requester.role !== 'admin' && requester.role !== 'provider') {
      throw new ForbiddenException(
        'Only admin or provider can view unreachable list',
      );
    }
  }
}
