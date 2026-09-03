import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HealthController } from './health/health.controller';
import { EmploymentModule } from './modules/employment/employment.module';
import { VerificationModule } from './modules/verification/verification.module';
import { EmployersModule } from './modules/employers/employers.module';
import { TraineesModule } from './modules/trainees/trainees.module';
import { IdentityMatchesModule } from './modules/identity-matches/identity-matches.module';
import { FollowUpsModule } from './modules/follow-ups/follow-ups.module';
import { SkillGapsModule } from './modules/skill-gaps/skill-gaps.module';
import { AdaptersModule } from './modules/adapters/adapters.module';
import { AuditModule } from './common/audit/audit.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    // M6-03: Rate limiting — 100 req / 60s per IP (ARCHITECTURE.md:164, PHASE-CHECKLIST.md:288)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuditModule,
    PrismaModule,
    AuthModule,
    TraineesModule,
    IdentityMatchesModule,
    FollowUpsModule,
    SkillGapsModule,
    EmploymentModule,
    VerificationModule,
    EmployersModule,
    AdaptersModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    // M6-03: ThrottlerGuard must be first so rate-limit applies before auth
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
