import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateEmploymentDto } from './dto/create-employment.dto';

@Injectable()
export class EmploymentService {
  private readonly logger = new Logger(EmploymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateEmploymentDto,
    actor?: { id: string; role: string; traineeId?: string },
  ) {
    const isTrainee = actor?.role === 'trainee';
    const targetTraineeId = isTrainee ? actor.traineeId : dto.trainee_id;

    if (!targetTraineeId) {
      throw new BadRequestException(
        'trainee_id is required (or the actor must be a trainee)',
      );
    }

    const trainee = await this.prisma.trainee.findUnique({
      where: { id: targetTraineeId },
    });
    if (!trainee) {
      throw new NotFoundException(`Trainee ${targetTraineeId} not found`);
    }

    if (dto.training_id) {
      const training = await this.prisma.trainingRecord.findUnique({
        where: { id: dto.training_id },
      });
      if (!training) {
        throw new NotFoundException(
          `Training record ${dto.training_id} not found`,
        );
      }
    }

    if (dto.employer_id) {
      const employer = await this.prisma.employer.findUnique({
        where: { id: dto.employer_id },
      });
      if (!employer) {
        throw new NotFoundException(`Employer ${dto.employer_id} not found`);
      }
    }

    const record = await this.prisma.employmentRecord.create({
      data: {
        trainee_id: targetTraineeId,
        training_id: dto.training_id ?? null,
        employer_id: dto.employer_id ?? null,
        job_role: dto.job_role ?? null,
        employment_type: dto.employment_type,
        joining_date: dto.joining_date ? new Date(dto.joining_date) : null,
        current_salary: dto.current_salary ?? null,
        salary_currency: dto.salary_currency ?? 'INR',
        job_relevant_to_training: dto.job_relevant_to_training ?? null,
        verification_status: 'self_reported',
        confidence_score: 20,
      },
    });

    this.logger.log(
      `Employment record created: ${record.id} (trainee: ${targetTraineeId}, score: 20)`,
    );

    await this.tryAudit({
      actor: actor,
      action: 'employment.create',
      entityType: 'employment_record',
      entityId: record.id,
      newValue: {
        trainee_id: record.trainee_id,
        employment_type: record.employment_type,
        job_role: record.job_role,
      },
    });

    return {
      ...record,
      level: this.getLevel(Number(record.confidence_score)),
    };
  }

  async findById(
    id: string,
    actor?: {
      id?: string;
      role?: string;
      traineeId?: string;
      employerId?: string;
    },
  ) {
    const record = await this.prisma.employmentRecord.findUnique({
      where: { id },
      include: {
        trainee: { select: { id: true, name: true, phone: true } },
        employer: { select: { id: true, name: true } },
        evidence: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`Employment record ${id} not found`);
    }

    const role = actor?.role;
    const isPrivileged =
      role === 'admin' || role === 'government' || role === 'provider';
    const isOwnerTrainee =
      role === 'trainee' && actor?.traineeId === record.trainee_id;
    const isOwnerEmployer =
      role === 'employer' && actor?.employerId === record.employer_id;

    if (!isPrivileged && !isOwnerTrainee && !isOwnerEmployer) {
      throw new ForbiddenException(
        'You do not have access to this employment record',
      );
    }

    return {
      ...record,
      level: this.getLevel(Number(record.confidence_score)),
    };
  }

  private getLevel(score: number): string {
    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'UNVERIFIED';
  }

  private async tryAudit(entry: {
    actor?: { id?: string; role?: string } | null;
    action: string;
    entityType?: string;
    entityId?: string;
    newValue?: unknown;
    oldValue?: unknown;
  }) {
    try {
      await this.audit.record(entry as any);
    } catch (err) {
      this.logger.warn(
        `Audit write failed for ${entry.action} (${entry.entityId}): ${(err as Error).message}`,
      );
    }
  }
}
