import { Module } from '@nestjs/common';
import { EpfoAdapter } from './epfo.adapter';
import { UdyamAdapter } from './udyam.adapter';
import { EsicAdapter } from './esic.adapter';
import { ExternalVerificationAdapter } from './external-verification.adapter';

@Module({
  providers: [
    EpfoAdapter,
    UdyamAdapter,
    EsicAdapter,
    ExternalVerificationAdapter,
  ],
  exports: [ExternalVerificationAdapter],
})
export class AdaptersModule {}
