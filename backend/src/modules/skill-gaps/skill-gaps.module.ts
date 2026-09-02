import { Module } from '@nestjs/common';
import { SkillGapsController } from './skill-gaps.controller';
import { SkillGapsService } from './skill-gaps.service';

@Module({
  controllers: [SkillGapsController],
  providers: [SkillGapsService],
  exports: [SkillGapsService],
})
export class SkillGapsModule {}
