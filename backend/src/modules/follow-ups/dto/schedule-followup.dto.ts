import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Channel } from '@prisma/client';

export class ScheduleFollowUpDto {
  @ApiProperty({ description: 'Trainee UUID' })
  @IsUUID()
  @IsNotEmpty()
  trainee_id!: string;

  @ApiPropertyOptional({ description: 'Related employment record UUID' })
  @IsUUID()
  @IsOptional()
  employment_id?: string;

  @ApiProperty({
    description: 'Months after training (1, 3, 6, 12 or 24)',
    enum: [1, 3, 6, 12, 24],
  })
  @IsInt()
  @Min(1)
  months_after_training!: number;

  @ApiPropertyOptional({ enum: Channel, default: Channel.whatsapp })
  @IsEnum(Channel)
  @IsOptional()
  channel?: Channel;

  @ApiPropertyOptional({ description: 'Scheduled date (ISO-8601)' })
  @IsDateString()
  @IsOptional()
  follow_up_date?: string;

  @ApiPropertyOptional({
    description: 'Pre-filled survey questions (JSON object)',
  })
  @IsOptional()
  questions?: Record<string, unknown>;
}
