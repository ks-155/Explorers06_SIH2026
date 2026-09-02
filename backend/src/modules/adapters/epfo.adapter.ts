import { Logger } from '@nestjs/common';

export interface EpfoCheckResult {
  verified: boolean;
  data: {
    uan: string;
    employerName: string;
    status: string;
    lastContributionDate?: string;
  };
}

export class EpfoAdapter {
  private readonly logger = new Logger(EpfoAdapter.name);

  async check(uan: string, employerName: string): Promise<EpfoCheckResult> {
    this.logger.log(`[MOCK] EPFO check for UAN: ${uan}, employer: ${employerName}`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      verified: true,
      data: {
        uan,
        employerName,
        status: 'active',
        lastContributionDate: new Date().toISOString(),
      },
    };
  }
}
