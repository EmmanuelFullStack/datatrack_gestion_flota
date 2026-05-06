import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TenantRequest extends Request {
  tenantId?: string;
  userId?: string;
  userRole?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: TenantRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('jwt.secret'),
        }) as { sub: string; tenantId: string | null; role: string };

        req.tenantId  = payload.tenantId ?? undefined;
        req.userId    = payload.sub;
        req.userRole  = payload.role;
      } catch {
        // Invalid token — guards will reject the request later
        this.logger.debug('Could not decode tenant from token');
      }
    }

    next();
  }
}
