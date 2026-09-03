import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuditService,
  AuditEntryInput,
} from '../../common/audit/audit.service';
import { ConfidenceScoreService } from '../verification/confidence-score.service';
import { CreateEmployerDto } from './dto/create-employer.dto';
import { VerifyEmploymentDto } from './dto/verify-employer.dto';

@Injectable()
export class EmployersService {
  private readonly logger = new Logger(EmployersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly confidenceScore: ConfidenceScoreService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateEmployerDto, actor?: { id: string; role: string }) {
    const employer = await this.prisma.employer.create({
      data: {
        name: dto.name,
        udyam_number: dto.udyam_number ?? null,
        industry: dto.industry ?? null,
        district_id: dto.district_id ?? null,
        state: dto.state ?? null,
        contact_person: dto.contact_person ?? null,
        contact_phone: dto.contact_phone ?? null,
        contact_email: dto.contact_email ?? null,
      },
    });

    this.logger.log(`Employer created: ${employer.id} (${employer.name})`);

    await this.tryAudit({
      actor: actor,
      action: 'employer.create',
      entityType: 'employer',
      entityId: employer.id,
      newValue: { name: employer.name, udyam_number: employer.udyam_number },
    });

    return employer;
  }

  async findById(id: string, actor?: { role?: string; employerId?: string }) {
    if (actor?.role === 'employer' && actor.employerId !== id) {
      throw new ForbiddenException(
        'You can only view your own employer profile',
      );
    }

    const employer = await this.prisma.employer.findUnique({
      where: { id },
      include: {
        employment_records: {
          select: {
            id: true,
            job_role: true,
            verification_status: true,
            confidence_score: true,
          },
        },
      },
    });

    if (!employer) {
      throw new NotFoundException(`Employer ${id} not found`);
    }

    const pendingCount = employer.employment_records.filter(
      (r) => r.verification_status === 'pending',
    ).length;

    return {
      ...employer,
      pending_verifications: pendingCount,
    };
  }

  async findPendingVerifications(employerId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
    });

    if (!employer) {
      throw new NotFoundException(`Employer ${employerId} not found`);
    }

    const pending = await this.prisma.employmentRecord.findMany({
      where: {
        employer_id: employerId,
        verification_status: 'pending',
      },
      include: {
        trainee: { select: { id: true, name: true, phone: true } },
        training: { select: { id: true, job_role: true, sector: true } },
      },
    });

    return pending;
  }

  async verifyEmployment(dto: VerifyEmploymentDto, employerUserId: string) {
    const employment = await this.prisma.employmentRecord.findUnique({
      where: { id: dto.employment_id },
      include: { evidence: true, employer: true },
    });

    if (!employment) {
      throw new NotFoundException(
        `Employment record ${dto.employment_id} not found`,
      );
    }

    if (!employment.employer_id) {
      throw new BadRequestException('Employment record has no linked employer');
    }

    const employerUser = await this.prisma.user.findUnique({
      where: { id: employerUserId },
    });

    if (
      employerUser?.employer_id &&
      employerUser.employer_id !== employment.employer_id
    ) {
      throw new ForbiddenException(
        'You can only verify employment claims for your own organization',
      );
    }

    if (dto.decision === 'deny') {
      const updated = await this.prisma.employmentRecord.update({
        where: { id: dto.employment_id },
        data: {
          verification_status: 'rejected',
          verified_by: `employer:${employerUserId}`,
          verification_date: new Date(),
        },
      });

      this.logger.log(
        `Employment ${dto.employment_id} DENIED by employer ${employerUserId}`,
      );

      await this.tryAudit({
        actor: { id: employerUserId, role: 'employer' },
        action: 'employment.denied',
        entityType: 'employment_record',
        entityId: dto.employment_id,
        oldValue: { verification_status: employment.verification_status },
        newValue: { verification_status: 'rejected' },
      });

      return {
        ...updated,
        level: this.confidenceScore.getLevel(Number(updated.confidence_score)),
      };
    }

    const evidenceTypes = employment.evidence.map((e) => e.evidence_type);
    const isEmployerConfirmed = true;
    const score = this.confidenceScore.calculate(
      true,
      isEmployerConfirmed,
      evidenceTypes,
    );

    const newStatus =
      score.total >= 80 ? 'evidence_confirmed' : 'employer_confirmed';

    const updated = await this.prisma.employmentRecord.update({
      where: { id: dto.employment_id },
      data: {
        verification_status: newStatus,
        confidence_score: score.total,
        verified_by: `employer:${employerUserId}`,
        verification_date: new Date(),
        job_relevant_to_training:
          dto.job_relevant ?? employment.job_relevant_to_training,
        leaving_date:
          dto.still_employed === false ? new Date() : employment.leaving_date,
      },
    });

    await this.prisma.verificationEvidence.create({
      data: {
        employment_id: dto.employment_id,
        evidence_type: 'employer_confirmation',
        evidence_data: {
          decision: 'confirm',
          still_employed: dto.still_employed,
          job_relevant: dto.job_relevant,
        },
        verified_by: `employer:${employerUserId}`,
        verified_at: new Date(),
        confidence_contribution: 40,
      },
    });

    this.logger.log(
      `Employment ${dto.employment_id} CONFIRMED by employer ${employerUserId}, score: ${score.total}`,
    );

    await this.tryAudit({
      actor: { id: employerUserId, role: 'employer' },
      action: 'employment.confirmed',
      entityType: 'employment_record',
      entityId: dto.employment_id,
      oldValue: { verification_status: employment.verification_status },
      newValue: {
        verification_status: newStatus,
        confidence_score: score.total,
      },
    });

    return {
      ...updated,
      level: score.level,
      breakdown: score,
    };
  }

  private getLevel(score: number): string {
    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'UNVERIFIED';
  }

  private async tryAudit(entry: {
    actor?: {
      id?: string;
      role?: string;
      traineeId?: string;
      employerId?: string;
    } | null;
    action: string;
    entityType?: string;
    entityId?: string;
    newValue?: unknown;
    oldValue?: unknown;
  }) {
    try {
      await this.audit.record(entry as AuditEntryInput);
    } catch (err) {
      this.logger.warn(
        `Audit write failed for ${entry.action} (${entry.entityId}): ${(err as Error).message}`,
      );
    }
  }
}
