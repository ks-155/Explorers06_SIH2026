import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class RunMatchDto {
  @ApiPropertyOptional({
    description:
      'Scope matching to a single trainee. Omit to run a full sweep over all canonical trainees.',
  })
  @IsUUID()
  @IsOptional()
  trainee_id?: string;
}
