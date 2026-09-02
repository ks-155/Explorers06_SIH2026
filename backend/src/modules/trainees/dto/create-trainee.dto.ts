import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTraineeDto {
  @ApiProperty({ description: 'Trainee full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Primary phone (E.164 or local)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  phone!: string;

  @ApiPropertyOptional({ description: 'Alternate phone' })
  @IsString()
  @IsOptional()
  @MaxLength(15)
  alternate_phone?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'District id (from reference data)' })
  @IsInt()
  @IsOptional()
  district_id?: number;

  @ApiPropertyOptional({ description: 'State name' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  state?: string;

  @ApiPropertyOptional({
    description:
      'SHA-256 hash of Aadhaar (12-digit). Only the hash is stored, never the raw number.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  aadhaar_hash?: string;

  @ApiProperty({ description: 'Consent opt-in flag' })
  @IsBoolean()
  consent_given!: boolean;

  @ApiPropertyOptional({ description: 'Consent doc version, e.g. 1.0' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  consent_version?: string;

  @ApiPropertyOptional({ description: 'Preferred language, e.g. hi/mr/en' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  preferred_language?: string;

  @ApiPropertyOptional({ description: 'Preferred channel, e.g. whatsapp/sms' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  preferred_channel?: string;
}
