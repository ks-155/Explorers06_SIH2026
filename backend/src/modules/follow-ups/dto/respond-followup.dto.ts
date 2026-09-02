import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class RespondFollowUpDto {
  @ApiProperty({
    description:
      'Survey answers (JSON object, e.g. { working: "yes", same_employer: true })',
  })
  @IsNotEmpty()
  responses!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Reason if trainee reported not working',
  })
  @IsString()
  @IsOptional()
  non_placement_reason?: string;

  @ApiProperty({
    description: 'Time taken to respond, in seconds',
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  response_time_seconds!: number;
}
