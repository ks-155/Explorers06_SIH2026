import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuditService,
  AuditEntryInput,
} from '../../common/audit/audit.service';
import { ConfidenceScoreService } from './confidence-score.service';
import { VerificationStatus, EvidenceType, Prisma } from '@prisma/client';
import {
  ExternalVerificationAdapter,
  ExternalCheckResult,
} from '../adapters/external-verification.adapter';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  private readonly validTransitions: Record<string, VerificationStatus[]> = {
    self_reported: ['pending'],
    pending: ['employer_confirmed', 'rejected'],
    employer_confirmed: ['evidence_confirmed', 'pending'],
    evidence_confirmed: [],
    rejected: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly confidenceScore: ConfidenceScoreService,
    private readonly externalAdapter: ExternalVerificationAdapter,
    private readonly audit: AuditService,
  ) {}

  async triggerVerification(
    employmentId: string,
    actor?: { id?: string; role?: string },
  ) {
    const record = await this.prisma.employmentRecord.findUnique({
      where: { id: employmentId },
      include: { evidence: true },
    });

    if (!record) {
      throw new NotFoundException(
        `Employment record ${employmentId} not found`,
      );
    }

    const allowed = this.validTransitions[record.verification_status] ?? [];
    if (!allowed.includes('pending')) {
      throw new BadRequestException(
        `Cannot trigger verification from status "${record.verification_status}"`,
      );
    }

    const actorId = actor?.id ?? 'system';
    const updated = await this.prisma.employmentRecord.update({
      where: { id: employmentId },
      data: {
        verification_status: 'pending',
        verified_by: actorId,
        verification_date: new Date(),
      },
    });

    this.logger.log(
      `Verification triggered for employment ${employmentId} by ${actorId}`,
    );

    await this.tryAudit({
      actor: actor,
      action: 'employment.verify_triggered',
      entityType: 'employment_record',
      entityId: employmentId,
      oldValue: { verification_status: record.verification_status },
      newValue: { verification_status: 'pending' },
    });

    const score = this.confidenceScore.calculate(
      true,
      false,
      record.evidence.map((e) => e.evidence_type),
    );

    return {
      ...updated,
      confidence_score: score.total,
      level: score.level,
      breakdown: score,
    };
  }

  async addEvidence(
    employmentId: string,
    evidenceType: EvidenceType,
    evidenceData: Record<string, unknown>,
    actor: { id?: string; role?: string } | null,
  ) {
    const record = await this.prisma.employmentRecord.findUnique({
      where: { id: employmentId },
      include: { evidence: true },
    });

    if (!record) {
      throw new NotFoundException(
        `Employment record ${employmentId} not found`,
      );
    }

    if (record.verification_status === 'rejected') {
      throw new BadRequestException('Cannot add evidence to a rejected record');
    }

    const existingTypes = record.evidence.map((e) => e.evidence_type);
    if (existingTypes.includes(evidenceType)) {
      throw new BadRequestException(
        `Evidence type "${evidenceType}" already submitted`,
      );
    }

    const baseContribution =
      this.confidenceScore.getEvidenceContribution(evidenceType);

    // Run the corresponding external (mocked) check for EPFO / Udyam.
    // Only grant the confidence points if the external check passes.
    const contribution = baseContribution;
    let evidenceDataToStore = evidenceData;
    if (evidenceType === 'epfo_check' || evidenceType === 'udyam_link') {
      const check: ExternalCheckResult =
        await this.externalAdapter.checkEvidence(evidenceType, evidenceData);

      if (!check.checked || !check.verified) {
        throw new BadRequestException(
          `External check failed for "${evidenceType}": could not verify`,
        );
      }

      evidenceDataToStore = {
        ...evidenceData,
        external_check: {
          verified: true,
          data: check.data ?? {},
        },
      };
    }

    const evidence = await this.prisma.verificationEvidence.create({
      data: {
        employment_id: employmentId,
        evidence_type: evidenceType,
        evidence_data: evidenceDataToStore as unknown as Prisma.InputJsonValue,
        verified_by: actor?.id ?? 'system',
        verified_at: new Date(),
        confidence_contribution: contribution,
      },
    });

    const allEvidenceTypes: EvidenceType[] = [...existingTypes, evidenceType];

    const isEmployerConfirmed =
      record.verification_status === 'employer_confirmed' ||
      allEvidenceTypes.includes('employer_confirmation');

    const score = this.confidenceScore.calculate(
      true,
      isEmployerConfirmed,
      allEvidenceTypes,
    );

    const newStatus: VerificationStatus =
      score.total >= 80 ? 'evidence_confirmed' : record.verification_status;

    const updated = await this.prisma.employmentRecord.update({
      where: { id: employmentId },
      data: {
        confidence_score: score.total,
        verification_status: newStatus,
        salary_verified:
          evidenceType === 'salary_slip' ? true : record.salary_verified,
      },
    });

    this.logger.log(
      `Evidence added to employment ${employmentId}: ${evidenceType} (+${contribution}), new score: ${score.total}`,
    );

    await this.tryAudit({
      actor: actor,
      action: 'employment.evidence_added',
      entityType: 'verification_evidence',
      entityId: evidence.id,
      newValue: {
        evidence_type: evidenceType,
        confidence_contribution: contribution,
        employment_id: employmentId,
      },
    });

    return {
      employment: {
        ...updated,
        level: score.level,
      },
      evidence,
      breakdown: score,
    };
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
