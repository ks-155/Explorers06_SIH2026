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

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Linked trainee UUID (trainee role)',
  })
  traineeId?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Linked employer UUID (employer role)',
  })
  employerId?: string | null;
}
