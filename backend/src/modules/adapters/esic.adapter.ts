import { Logger } from '@nestjs/common';

export interface EsicCheckResult {
  verified: boolean;
  data: {
    insuranceNumber: string;
    status: string;
    employerName?: string;
  };
}

export class EsicAdapter {
  private readonly logger = new Logger(EsicAdapter.name);

  async check(insuranceNumber: string): Promise<EsicCheckResult> {
    this.logger.log(`[MOCK] ESIC check for: ${insuranceNumber}`);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      verified: true,
      data: {
        insuranceNumber,
        status: 'active',
        employerName: 'Mock Employer',
      },
    };
  }
}
