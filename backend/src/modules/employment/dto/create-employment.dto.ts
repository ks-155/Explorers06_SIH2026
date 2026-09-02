import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { EmploymentType } from '@prisma/client';

export class CreateEmploymentDto {
  @ApiProperty({ description: 'Trainee UUID' })
  @IsUUID()
  @IsNotEmpty()
  trainee_id!: string;

  @ApiPropertyOptional({ description: 'Training record UUID' })
  @IsUUID()
  @IsOptional()
  training_id?: string;

  @ApiPropertyOptional({ description: 'Employer UUID' })
  @IsUUID()
  @IsOptional()
  employer_id?: string;

  @ApiPropertyOptional({ description: 'Job role title' })
  @IsString()
  @IsOptional()
  job_role?: string;

  @ApiProperty({ enum: EmploymentType, default: EmploymentType.full_time })
  @IsEnum(EmploymentType)
  @IsNotEmpty()
  employment_type!: EmploymentType;

  @ApiPropertyOptional({ description: 'Joining date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  joining_date?: string;

  @ApiPropertyOptional({ description: 'Current salary in INR' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  current_salary?: number;

  @ApiPropertyOptional({ default: 'INR' })
  @IsString()
  @IsOptional()
  salary_currency?: string;

  @ApiPropertyOptional({ description: 'Is job relevant to training?' })
  @IsBoolean()
  @IsOptional()
  job_relevant_to_training?: boolean;
}
