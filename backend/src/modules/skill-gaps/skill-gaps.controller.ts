import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SkillGapsService } from './skill-gaps.service';

// Skill-gaps is M6 per ARCHITECTURE.md:73 (gap detection).
// Analytics KPIs (dashboard/retention/wage/provider/district/course) now live
// in AnalyticsModule (analytics.controller.ts + analytics.service.ts). Keeping
// this controller at @Controller('analytics') would collide with AnalyticsController,
// so skill-gaps now serves only GET /analytics/skill-gaps.

@ApiTags('SkillGaps')
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
