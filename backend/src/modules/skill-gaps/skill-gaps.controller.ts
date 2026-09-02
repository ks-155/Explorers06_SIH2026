import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SkillGapsService } from './skill-gaps.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class SkillGapsController {
  constructor(private readonly skillGapsService: SkillGapsService) {}

  @Get('skill-gaps')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Skill gaps + recommendations' })
  findSkillGaps() {
    return this.skillGapsService.findAll();
  }
}
