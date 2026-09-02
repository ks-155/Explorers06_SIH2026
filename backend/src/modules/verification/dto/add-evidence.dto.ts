import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class AddEvidenceDto {
  @ApiProperty({
    description: 'Evidence type',
    enum: [
      'salary_slip',
      'bank_statement',
      'offer_letter',
      'udyam_link',
      'epfo_check',
      'self_declaration',
    ],
  })
  @IsString()
  @IsNotEmpty()
  evidence_type!: string;

  @ApiPropertyOptional({ description: 'Evidence metadata (JSON)' })
  @IsObject()
  @IsOptional()
  evidence_data?: Record<string, any>;
}
