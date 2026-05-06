import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../../tenants/domain/repositories/tenant.repository.port';
import { Role } from '../../domain/entities/user.entity';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

@Injectable()
export class SelectTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: TenantRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  async execute(adminUserId: string, adminEmail: string, tenantId: string) {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant', tenantId);

    const token = this.jwtService.sign({
      sub: adminUserId,
      email: adminEmail,
      role: Role.SUPER_ADMIN,
      tenantId,
      tenantNombre: tenant.nombre,
    });

    return { 
      accessToken: token, 
      expiresIn: '8h', 
      tenantNombre: tenant.nombre,
      tenantLogo: tenant.logoUrl
    };
  }
}
