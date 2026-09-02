import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { ConfidenceScoreService } from './confidence-score.service';
import { AdaptersModule } from '../adapters/adapters.module';

@Module({
  imports: [AdaptersModule],
  controllers: [VerificationController],
  providers: [VerificationService, ConfidenceScoreService],
  exports: [VerificationService, ConfidenceScoreService],
})
export class VerificationModule {}
