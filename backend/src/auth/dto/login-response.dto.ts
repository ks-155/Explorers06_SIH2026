import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token (15 min)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token (7 days)' })
  refreshToken: string;

  @ApiProperty({ enum: Role, description: 'Role of the authenticated user' })
  role: Role;

  @ApiProperty({ description: 'Authenticated user id' })
  userId: string;
}
