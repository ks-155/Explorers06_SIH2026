import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TraineesService } from './trainees.service';
import { CreateTraineeDto } from './dto/create-trainee.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { RunMatchDto } from './dto/run-match.dto';

@ApiTags('Trainees')
@ApiBearerAuth()
@Controller('trainees')
export class TraineesController {
  constructor(private readonly traineesService: TraineesService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Register a trainee with consent' })
  create(
    @Body() dto: CreateTraineeDto,
    @Req() req: Request,
    @CurrentUser() actor?: AuthenticatedUser | null,
  ) {
    return this.traineesService.create(dto, actor ?? null, req.ip);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trainee profile' })
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.traineesService.findById(id, actor);
  }

  @Post('match')
  @Roles(Role.admin, Role.provider)
  @ApiOperation({ summary: 'Run identity matching (dedup sweep)' })
  runMatch(@Body() dto: RunMatchDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.traineesService.runMatch(dto, actor);
  }

  @Put(':id/consent')
  @ApiOperation({ summary: 'Update versioned consent (opt-in/out)' })
  updateConsent(
    @Param('id') id: string,
    @Body() dto: UpdateConsentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.traineesService.updateConsent(id, dto, actor);
  }

  @Put(':id/contact-update')
  @ApiOperation({ summary: 'Update phone/location (re-links identity)' })
  updateContact(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.traineesService.updateContact(id, dto, actor);
  }

  @Get(':id/training')
  @ApiOperation({ summary: 'Get trainee training records' })
  training(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.traineesService.getTrainingRecords(id, actor);
  }

  @Get(':id/merge-candidates')
  @ApiOperation({ summary: 'List probable duplicates (proposed matches)' })
  mergeCandidates(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.traineesService.getMergeCandidates(id, actor);
  }
}
