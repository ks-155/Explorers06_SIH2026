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

  @Get('dashboard')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Dashboard KPIs: totals, retention, avg salary' })
  dashboard() {
    return this.skillGapsService.dashboard();
  }

  @Get('retention')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Retention rates at 3m/6m/12m/24m' })
  retention() {
    return this.skillGapsService.getRetention(90);
  }

  @Get('wage-progression')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Wage progression by months-after-training' })
  wageProgression() {
    return this.skillGapsService.wageProgression();
  }

  @Get('provider-ranking')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Top providers by placement rate' })
  providerRanking() {
    return this.skillGapsService.providerRanking();
  }

  @Get('district')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Analytics by district' })
  district() {
    return this.skillGapsService.districtAnalytics();
  }

  @Get('course')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Analytics by course/sector' })
  course() {
    return this.skillGapsService.courseAnalytics();
  }

  @Get('skill-gaps')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Skill gaps + recommendations' })
  findSkillGaps() {
    return this.skillGapsService.findAll();
  }
}
