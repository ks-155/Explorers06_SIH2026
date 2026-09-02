import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Login identifier (email or phone)',
    example: 'gov@mh.gov.in',
  })
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false, example: 'admin' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
