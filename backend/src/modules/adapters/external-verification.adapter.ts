import { Injectable, Logger } from '@nestjs/common';
import { EpfoAdapter, EpfoCheckResult } from './epfo.adapter';
import { UdyamAdapter, UdyamValidationResult } from './udyam.adapter';
import { EsicAdapter, EsicCheckResult } from './esic.adapter';

export interface ExternalCheckResult {
  checked: boolean;
  verified: boolean;
  data?: Record<string, unknown>;
}

/**
 * Evidence types that run an external (mocked) check when submitted.
 * `esic_check` is intentionally NOT listed: the frozen Prisma `EvidenceType`
 * enum and API contract (Phase 1) do not include ESIC as an uploadable
 * evidence type, and the schema is owned by Member 5. The ESIC adapter is
 * wired behind `checkEsic()` and can be promoted to a first-class evidence
 * type only after a contract/schema bump (Member 5 sign-off).
 */
export type ExternalEvidenceType = 'epfo_check' | 'udyam_link';

@Injectable()
export class ExternalVerificationAdapter {
  private readonly logger = new Logger(ExternalVerificationAdapter.name);

  constructor(
    private readonly epfo: EpfoAdapter,
    private readonly udyam: UdyamAdapter,
    private readonly esic: EsicAdapter,
  ) {}

  /**
   * Run the external (mocked) check that corresponds to the given evidence
   * type. Returns whether the check was attempted and whether it passed.
   */
  async checkEvidence(
    type: ExternalEvidenceType,
    evidenceData: Record<string, unknown>,
  ): Promise<ExternalCheckResult> {
    switch (type) {
      case 'epfo_check': {
        const uan = this.asString(evidenceData?.uan);
        const employerName = this.asString(evidenceData?.employer_name);
        if (!uan) {
          return { checked: false, verified: false };
        }
        const result: EpfoCheckResult = await this.epfo.check(
          uan,
          employerName,
        );
        this.logger.log(`EPFO check for ${uan}: verified=${result.verified}`);
        return {
          checked: true,
          verified: result.verified,
          data: result.data as unknown as Record<string, unknown>,
        };
      }

      case 'udyam_link': {
        const udyamNumber = this.asString(evidenceData?.udyam_number);
        if (!udyamNumber) {
          return { checked: false, verified: false };
        }
        const result: UdyamValidationResult =
          await this.udyam.validate(udyamNumber);
        this.logger.log(
          `Udyam validation for ${udyamNumber}: valid=${result.valid}`,
        );
        return {
          checked: true,
          verified: result.valid,
          data: result.data as unknown as Record<string, unknown>,
        };
      }

      default:
        return { checked: false, verified: false };
    }
  }

  /** Direct ESIC employment check (not tied to an evidence upload). */
  async checkEsic(insuranceNumber: string): Promise<EsicCheckResult> {
    return this.esic.check(insuranceNumber);
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
