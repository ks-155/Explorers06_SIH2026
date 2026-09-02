import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { ConfidenceScoreService } from './confidence-score.service';

@Module({
  controllers: [VerificationController],
  providers: [VerificationService, ConfidenceScoreService],
  exports: [VerificationService, ConfidenceScoreService],
})
export class VerificationModule {}
