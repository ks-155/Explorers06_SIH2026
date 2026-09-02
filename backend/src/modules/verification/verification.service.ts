import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfidenceScoreService } from './confidence-score.service';
import { VerificationStatus } from '@prisma/client';

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
  ) {}

  async triggerVerification(employmentId: string, actorId: string) {
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
    evidenceType: string,
    evidenceData: any,
    verifiedBy: string,
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
    if (existingTypes.includes(evidenceType as any)) {
      throw new BadRequestException(
        `Evidence type "${evidenceType}" already submitted`,
      );
    }

    const contribution = this.confidenceScore.getEvidenceContribution(
      evidenceType as any,
    );

    const evidence = await this.prisma.verificationEvidence.create({
      data: {
        employment_id: employmentId,
        evidence_type: evidenceType as any,
        evidence_data: evidenceData ?? {},
        verified_by: verifiedBy,
        verified_at: new Date(),
        confidence_contribution: contribution,
      },
    });

    const allEvidenceTypes = [...existingTypes, evidenceType] as any[];

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

    return {
      employment: {
        ...updated,
        level: score.level,
      },
      evidence,
      breakdown: score,
    };
  }
}
