import { LoginUseCase } from '../login.use-case';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.port';
import { PASSWORD_SERVICE } from '../../../domain/services/password.service.port';
import { TENANT_REPOSITORY } from '../../../../tenants/domain/repositories/tenant.repository.port';
import { User, Role } from '../../../domain/entities/user.entity';
import { Tenant, TenantEstado, PlanSuscripcion } from '../../../../tenants/domain/entities/tenant.entity';
import { UnauthorizedError } from '../../../../../shared/domain/errors/unauthorized.error';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const mockUserRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAllByTenant: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockTenantRepo = {
  findByNit: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockPasswordService = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('24h'),
};

const activeTenant = Tenant.create({
  id: 'tenant-uuid-1',
  nombre: 'Empresa Test',
  nit: '900123456-1',
  ciudad: 'Bogotá',
  estado: TenantEstado.ACTIVO,
  planSuscripcion: PlanSuscripcion.BASICO,
});

const inactiveTenant = Tenant.create({
  id: 'tenant-uuid-2',
  nombre: 'Empresa Inactiva',
  nit: '999999999-9',
  ciudad: 'Cali',
  estado: TenantEstado.INACTIVO,
  planSuscripcion: PlanSuscripcion.BASICO,
});

const activeUser = User.create({
  id: 'user-uuid-1',
  nombre: 'Test Admin',
  email: 'admin@test.com',
  passwordHash: 'hashed_password',
  role: Role.TENANT_ADMIN,
  activo: true,
  tenantId: 'tenant-uuid-1',
});

const inactiveUser = User.create({
  id: 'user-uuid-2',
  nombre: 'Test Inactive',
  email: 'inactive@test.com',
  passwordHash: 'hashed_password',
  role: Role.TENANT_USER,
  activo: false,
  tenantId: 'tenant-uuid-1',
});

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LoginUseCase(
      mockUserRepo as any,
      mockTenantRepo as any,
      mockPasswordService as any,
      mockJwtService as any,
      mockConfigService as any,
    );
  });

  // Test Case 1: Successful login
  it('should return access token on valid credentials', async () => {
    mockTenantRepo.findByNit.mockResolvedValue(activeTenant);
    mockUserRepo.findByEmail.mockResolvedValue(activeUser);
    mockPasswordService.compare.mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'admin@test.com',
      password: 'password123',
      tenantNit: '900123456-1',
    });

    expect(result.accessToken).toBe('mock.jwt.token');
    expect(result.user.email).toBe('admin@test.com');
    expect(result.user.tenantId).toBe('tenant-uuid-1');
  });

  // Test Case 2: Tenant not found
  it('should throw NotFoundError when tenant NIT does not exist', async () => {
    mockTenantRepo.findByNit.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'admin@test.com', password: 'pass', tenantNit: 'invalid-nit' }),
    ).rejects.toThrow(NotFoundError);
  });

  // Test Case 3: Inactive tenant
  it('should throw UnauthorizedError when tenant is inactive', async () => {
    mockTenantRepo.findByNit.mockResolvedValue(inactiveTenant);

    await expect(
      useCase.execute({ email: 'admin@test.com', password: 'pass', tenantNit: '999999999-9' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  // Test Case 4: User not found in tenant
  it('should throw UnauthorizedError when user email not found in tenant', async () => {
    mockTenantRepo.findByNit.mockResolvedValue(activeTenant);
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'nonexistent@test.com', password: 'pass', tenantNit: '900123456-1' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  // Test Case 5: Wrong password
  it('should throw UnauthorizedError when password is incorrect', async () => {
    mockTenantRepo.findByNit.mockResolvedValue(activeTenant);
    mockUserRepo.findByEmail.mockResolvedValue(activeUser);
    mockPasswordService.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'admin@test.com', password: 'wrongpassword', tenantNit: '900123456-1' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  // Test Case 6: Inactive user
  it('should throw UnauthorizedError when user account is disabled', async () => {
    mockTenantRepo.findByNit.mockResolvedValue(activeTenant);
    mockUserRepo.findByEmail.mockResolvedValue(inactiveUser);

    await expect(
      useCase.execute({ email: 'inactive@test.com', password: 'pass', tenantNit: '900123456-1' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  // Test Case 7: JWT is correctly signed with tenantId
  it('should include tenantId in JWT payload', async () => {
    mockTenantRepo.findByNit.mockResolvedValue(activeTenant);
    mockUserRepo.findByEmail.mockResolvedValue(activeUser);
    mockPasswordService.compare.mockResolvedValue(true);

    await useCase.execute({ email: 'admin@test.com', password: 'password123', tenantNit: '900123456-1' });

    expect(mockJwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-uuid-1' }),
      expect.any(Object),
    );
  });

  // Test Case 8: Response includes tenant name
  it('should include tenant name in response', async () => {
    mockTenantRepo.findByNit.mockResolvedValue(activeTenant);
    mockUserRepo.findByEmail.mockResolvedValue(activeUser);
    mockPasswordService.compare.mockResolvedValue(true);

    const result = await useCase.execute({ email: 'admin@test.com', password: 'password123', tenantNit: '900123456-1' });
    expect(result.user.tenantNombre).toBe('Empresa Test');
  });
});
