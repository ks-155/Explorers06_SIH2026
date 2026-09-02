import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class VerifyEmploymentDto {
  @ApiProperty({ description: 'Employment record UUID' })
  @IsUUID()
  @IsNotEmpty()
  employment_id!: string;

  @ApiProperty({ description: 'Decision: confirm or deny', enum: ['confirm', 'deny'] })
  @IsString()
  @IsNotEmpty()
  decision!: 'confirm' | 'deny';

  @ApiPropertyOptional({ description: 'Is trainee still employed?' })
  @IsBoolean()
  @IsOptional()
  still_employed?: boolean;

  @ApiPropertyOptional({ description: 'Is job relevant to training?' })
  @IsBoolean()
  @IsOptional()
  job_relevant?: boolean;
}
