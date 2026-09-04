import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { TraineesController } from './trainees.controller';
import { TraineesService } from './trainees.service';

@Module({
  imports: [AuthModule],
  controllers: [TraineesController],
  providers: [TraineesService],
  exports: [TraineesService],
})
export class TraineesModule {}
