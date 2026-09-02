import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { VerificationService } from './verification.service';
import { ConfidenceScoreService } from './confidence-score.service';
import { AddEvidenceDto } from './dto/add-evidence.dto';

@ApiTags('Verification')
@ApiBearerAuth()
@Controller('employment')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly confidenceScore: ConfidenceScoreService,
  ) {}

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger verification for employment record' })
  triggerVerification(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.verificationService.triggerVerification(id, user.id);
  }

  @Post(':id/evidence')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add verification evidence to employment record' })
  addEvidence(
    @Param('id') id: string,
    @Body() dto: AddEvidenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.verificationService.addEvidence(
      id,
      dto.evidence_type,
      dto.evidence_data ?? {},
      user.id,
    );
  }
}
