import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateContactDto {
  @ApiPropertyOptional({ description: 'New primary phone' })
  @IsString()
  @IsOptional()
  @MaxLength(15)
  phone?: string;

  @ApiPropertyOptional({ description: 'New alternate phone' })
  @IsString()
  @IsOptional()
  @MaxLength(15)
  alternate_phone?: string;

  @ApiPropertyOptional({ description: 'New district id' })
  @IsInt()
  @IsOptional()
  district_id?: number;

  @ApiPropertyOptional({ description: 'New state name' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  state?: string;
}
