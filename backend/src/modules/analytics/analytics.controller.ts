// AnalyticsModule — per ARCHITECTURE.md §2.2 + §5
// Previously analytics endpoints lived inside SkillGapsModule (skill-gaps.controller.ts
// was @Controller('analytics')). They are now in their own module. SkillGapsController
// remains responsible only for GET /analytics/skill-gaps.

import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Dashboard KPIs: totals, retention, avg salary' })
  dashboard() {
    return this.analyticsService.dashboard();
  }

  @Get('retention')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Retention rates at 3m/6m/12m/24m' })
  retention() {
    return this.analyticsService.getRetention(90);
  }

  @Get('wage-progression')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Wage progression by months-after-training' })
  wageProgression() {
    return this.analyticsService.wageProgression();
  }

  @Get('provider-ranking')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Top providers by placement rate' })
  providerRanking() {
    return this.analyticsService.providerRanking();
  }

  @Get('district')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Analytics by district' })
  district() {
    return this.analyticsService.districtAnalytics();
  }

  @Get('course')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Analytics by course/sector' })
  course() {
    return this.analyticsService.courseAnalytics();
  }

  @Get('district/:id')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'District details by ID' })
  districtById(@Param('id') id: string) {
    return this.analyticsService.districtById(id);
  }

  @Get('follow-up-monitoring')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Follow-up monitoring status breakdown' })
  followUpMonitoring() {
    return this.analyticsService.followUpMonitoring();
  }

  @Get('outcome-funnel')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Outcome funnel metrics' })
  outcomeFunnel() {
    return this.analyticsService.outcomeFunnel();
  }

  @Get('outcome-breakdown')
  @Roles(Role.admin, Role.government)
  @ApiOperation({ summary: 'Outcome breakdown by employment type' })
  outcomeBreakdown() {
    return this.analyticsService.outcomeBreakdown();
  }
}
