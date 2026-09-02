import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<UserPayload> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      role: user.role,
      traineeId: user.trainee_id,
      employerId: user.employer_id,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const payload = await this.validateUser(
      loginDto.identifier,
      loginDto.password,
    );

    const tokens = await this.issueTokens(payload);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: payload.role,
      userId: payload.id,
    };
  }

  async issueTokens(payload: UserPayload) {
    const jwtPayload = {
      sub: payload.id,
      role: payload.role,
      traineeId: payload.traineeId,
      employerId: payload.employerId,
    };

    const secret =
      this.config.get<string>('JWT_SECRET') ??
      'development-only-secret-change-in-production';

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      secret,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: payload.id },
      {
        secret,
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  /**
   * Useful for dev / seed: create a user with a bcrypt-hashed password.
   * Only used by seed scripts — never exposed as a public endpoint.
   */
  async hashPassword(password: string): Promise<string> {
    const rounds = Number(this.config.get<string>('BCRYPT_SALT_ROUNDS') || 10);
    return bcrypt.hash(password, rounds);
  }
}

export interface UserPayload {
  id: string;
  role: Role;
  traineeId?: string | null;
  employerId?: string | null;
}
