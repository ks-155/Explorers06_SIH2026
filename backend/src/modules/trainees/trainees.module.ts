import { Module } from '@nestjs/common';
import { TraineesController } from './trainees.controller';
import { TraineesService } from './trainees.service';

@Module({
  controllers: [TraineesController],
  providers: [TraineesService],
  exports: [TraineesService],
})
export class TraineesModule {}
