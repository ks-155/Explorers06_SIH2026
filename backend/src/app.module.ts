import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
import { AuditModule } from './common/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
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
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
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
