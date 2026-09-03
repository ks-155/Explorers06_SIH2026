import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Channel, FollowUpStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ScheduleFollowUpDto } from './dto/schedule-followup.dto';
import { RespondFollowUpDto } from './dto/respond-followup.dto';

const FOLLOW_UP_INTERVALS = [30, 90, 180, 365, 730]; // days: 30d, 3m, 6m, 12m, 24m
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_CHANNEL_ORDER: Channel[] = ['whatsapp', 'sms', 'phone'];

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

    // I3.1 (P3 integration): "working:yes" response → employment signal.
    // Best-effort: never fail the respond call if signal creation fails.
    await this.createEmploymentSignalIfWorking(followUp, dto, requester);

    return updated;
  }

  /**
   * I3.1 — WORKFLOW-FLOW.md:189: follow-up "Working: Yes" → employment
   * record (consumed by M3 verification). Creates a self-reported stub only
   * when the follow-up has no linked employment yet. Idempotent per
   * follow-up: re-responds are blocked above, and concurrent calls resolve
   * to a single record via the followUp.employment_id check + update.
   */
  private async createEmploymentSignalIfWorking(
    followUp: { id: string; trainee_id: string; employment_id: string | null },
    dto: RespondFollowUpDto,
    requester: AuthenticatedUser,
  ): Promise<void> {
    try {
      const responses: Record<string, unknown> = dto.responses ?? {};
      const working = responses['working'];
      const isWorking =
        working === true ||
        working === 'yes' ||
        working === 'Yes' ||
        working === 'YES' ||
        working === 1 ||
        working === '1';

      if (!isWorking || followUp.employment_id) {
        return;
      }

      const record = await this.prisma.employmentRecord.create({
        data: {
          trainee_id: followUp.trainee_id,
          verification_status: 'self_reported',
          confidence_score: 20,
          job_relevant_to_training:
            typeof responses['job_relevant'] === 'boolean'
              ? responses['job_relevant']
              : typeof responses['job_relevance'] === 'boolean'
                ? responses['job_relevance']
                : null,
        },
      });

      await this.prisma.followUp.update({
        where: { id: followUp.id },
        data: { employment_id: record.id },
      });

      await this.audit.record({
        actor: requester,
        action: 'employment.create',
        entityType: 'employment_record',
        entityId: record.id,
        newValue: {
          trainee_id: record.trainee_id,
          source: 'followup.signal',
          follow_up_id: followUp.id,
        },
      });

      this.logger.log(
        `Employment signal created: ${record.id} from follow-up ${followUp.id}`,
      );
    } catch (err) {
      this.logger.warn(
        `Employment signal failed for follow-up ${followUp.id}: ${(err as Error).message}`,
      );
    }
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

  /** Auto-scheduler: runs hourly, creates follow-ups at 30d/3m/6m/12m/24m after certification. */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoSchedule() {
    this.logger.log('Running auto-schedule for follow-ups');

    for (const days of FOLLOW_UP_INTERVALS) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - days);

      // Find trainees whose certification_date matches the target interval
      const trainees = await this.prisma.trainee.findMany({
        where: {
          consent_given: true,
          identity_status: 'canonical',
        },
        include: {
          training_records: {
            where: {
              certification_date: {
                lte: targetDate,
              },
              status: 'completed',
            },
            orderBy: { certification_date: 'desc' },
            take: 1,
          },
        },
      });

      for (const trainee of trainees) {
        if (trainee.training_records.length === 0) continue;
        const certDate = trainee.training_records[0].certification_date;
        if (!certDate) continue;

        const dueDate = new Date(certDate);
        dueDate.setDate(dueDate.getDate() + days);

        // Skip if already past due
        if (dueDate > new Date()) continue;

        // Check if a follow-up for this interval already exists
        const existing = await this.prisma.followUp.findFirst({
          where: {
            trainee_id: trainee.id,
            months_after_training: days,
          },
        });

        if (existing) continue;

        await this.prisma.followUp.create({
          data: {
            trainee_id: trainee.id,
            months_after_training: days,
            channel: trainee.preferred_channel as Channel,
            follow_up_date: dueDate,
            status: FollowUpStatus.scheduled,
            questions: Prisma.JsonNull,
            responses: Prisma.JsonNull,
            attempts: 0,
            channel_attempts: Prisma.JsonNull,
            next_retry_at: null,
          },
        });

        this.logger.log(
          `Auto-scheduled follow-up: trainee=${trainee.id}, interval=${days}d`,
        );
      }
    }
  }

  /** Retry handler: escalates channel on failure (whatsapp -> sms -> phone -> unreachable). */
  async markFailed(id: string, requester: AuthenticatedUser) {
    const followUp = await this.getFollowUpOrThrow(id);
    this.assertAdminOrProvider(requester);

    const attempts = (followUp.attempts || 0) + 1;
    const channelAttempts: Record<string, boolean> =
      (followUp.channel_attempts as Record<string, boolean>) ?? {};

    // Mark current channel as failed
    channelAttempts[followUp.channel] = true;

    // Find next channel to try
    const currentIdx = RETRY_CHANNEL_ORDER.indexOf(followUp.channel);
    const nextChannel =
      currentIdx >= 0 && currentIdx < RETRY_CHANNEL_ORDER.length - 1
        ? RETRY_CHANNEL_ORDER[currentIdx + 1]
        : null;

    const nextStatus =
      attempts >= MAX_RETRY_ATTEMPTS || !nextChannel
        ? FollowUpStatus.failed
        : FollowUpStatus.scheduled;

    const nextRetryAt =
      nextStatus === FollowUpStatus.scheduled
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // retry in 24h
        : null;

    const updated = await this.prisma.followUp.update({
      where: { id },
      data: {
        status: nextStatus,
        attempts,
        channel_attempts: channelAttempts,
        channel: nextChannel ?? followUp.channel,
        next_retry_at: nextRetryAt,
      },
    });

    await this.audit.record({
      actor: requester,
      action: 'followup.retry',
      entityType: 'follow_up',
      entityId: id,
      oldValue: { attempts: followUp.attempts, channel: followUp.channel },
      newValue: {
        attempts,
        channel: nextChannel ?? 'exhausted',
        status: nextStatus,
      },
    });

    this.logger.log(
      `Follow-up ${id}: attempt ${attempts}, next channel=${nextChannel ?? 'none'}, status=${nextStatus}`,
    );
    return updated;
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
