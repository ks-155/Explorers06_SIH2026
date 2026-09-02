import { Injectable } from '@nestjs/common';
import { EvidenceType } from '@prisma/client';

export interface ScoreBreakdown {
  self_report: number;
  employer_confirmed: number;
  evidence: { type: string; contribution: number }[];
  total: number;
  level: string;
}

@Injectable()
export class ConfidenceScoreService {
  calculate(
    isSelfReported: boolean,
    isEmployerConfirmed: boolean,
    evidenceTypes: EvidenceType[],
  ): ScoreBreakdown {
    let score = 0;
    const breakdown: ScoreBreakdown['evidence'] = [];

    if (isSelfReported) {
      score += 20;
      breakdown.push({ type: 'self_report', contribution: 20 });
    }

    if (isEmployerConfirmed) {
      score += 40;
      breakdown.push({ type: 'employer_confirmation', contribution: 40 });
    }

    for (const type of evidenceTypes) {
      if (type === 'employer_confirmation' && isEmployerConfirmed) {
        continue;
      }
      const contribution = this.getEvidenceContribution(type);
      if (contribution > 0) {
        score += contribution;
        breakdown.push({ type, contribution });
      }
    }

    score = Math.min(score, 100);

    return {
      self_report: isSelfReported ? 20 : 0,
      employer_confirmed: isEmployerConfirmed ? 40 : 0,
      evidence: breakdown,
      total: score,
      level: this.getLevel(score),
    };
  }

  getEvidenceContribution(type: EvidenceType): number {
    const contributions: Record<EvidenceType, number> = {
      employer_confirmation: 40,
      salary_slip: 15,
      bank_statement: 10,
      offer_letter: 10,
      udyam_link: 5,
      epfo_check: 20,
      self_declaration: 0,
    };
    return contributions[type] ?? 0;
  }

  getLevel(score: number): string {
    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'UNVERIFIED';
  }
}
