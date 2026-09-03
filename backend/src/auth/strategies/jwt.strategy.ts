import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  role: string;
  traineeId?: string;
  employerId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET is missing or too short (<32 chars). Refusing to start. Set JWT_SECRET in .env.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // AuthService signs { sub, role, traineeId?, employerId? } — see
  // auth.service.ts:issueTokens. employers.service.ts scoping relies on
  // payload.employerId matching the DB users.employer_id (FK
  // users_employer_id_fkey, migration 20260903040714_add_user_employer_relation).
  // This validate() trusts only what AuthService signed; tampering changes the
  // JWT signature and is rejected by passport-jwt before reaching here. No
  // extra DB lookup is needed in the validation hot path.
  validate(payload: JwtPayload) {
    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }
    // Enforce string-typed IDs when present — prevents e.g. numeric injection
    // via a hand-crafted token that passes structure but breaks scoping casts.
    // Allow null (prisma: trainee/employer not linked) — only reject non-string non-null.
    if (
      (payload.employerId != null && typeof payload.employerId !== 'string') ||
      (payload.traineeId != null && typeof payload.traineeId !== 'string')
    ) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      id: payload.sub,
      role: payload.role,
      traineeId: payload.traineeId,
      employerId: payload.employerId,
    };
  }
}
