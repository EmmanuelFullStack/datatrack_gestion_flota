import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/repositories/user.repository.port';

export interface JwtPayload {
  sub: string;
  tenantId: string | null;
  role: string;
  email: string;
  tenantNombre?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // SUPER_ADMIN is stored with tenantId = null regardless of which tenant they're operating in
    const tenantId = payload.role === 'SUPER_ADMIN' ? null : payload.tenantId;
    const user = await this.userRepo.findById(payload.sub, tenantId);
    if (!user || !user.isActive()) {
      throw new UnauthorizedException('User is inactive or no longer exists');
    }
    return payload;
  }
}
