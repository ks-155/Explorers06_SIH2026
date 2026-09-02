import { Logger } from '@nestjs/common';

export interface UdyamValidationResult {
  valid: boolean;
  data: {
    udyamNumber: string;
    status: string;
    type: string;
    enterpriseName?: string;
  };
}

export class UdyamAdapter {
  private readonly logger = new Logger(UdyamAdapter.name);

  async validate(udyamNumber: string): Promise<UdyamValidationResult> {
    this.logger.log(`[MOCK] Udyam validation for: ${udyamNumber}`);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      valid: true,
      data: {
        udyamNumber,
        status: 'active',
        type: 'MSME',
        enterpriseName: 'Mock Enterprise',
      },
    };
  }
}
