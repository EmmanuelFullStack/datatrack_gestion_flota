import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from "../../domain/repositories/user.repository.port";
import {
  PASSWORD_SERVICE,
  PasswordServicePort,
} from "../../domain/services/password.service.port";
import {
  TENANT_REPOSITORY,
  TenantRepositoryPort,
} from "../../../tenants/domain/repositories/tenant.repository.port";
import { UnauthorizedError } from "../../../../shared/domain/errors/unauthorized.error";
import { NotFoundError } from "../../../../shared/domain/errors/not-found.error";
import { LoginDto } from "../dtos/login.dto";
import { AuthResponseDto } from "../dtos/auth-response.dto";

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepositoryPort,
    @Inject(PASSWORD_SERVICE)
    private readonly passwordService: PasswordServicePort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    // Resolve tenant by NIT
    const tenant = await this.tenantRepository.findByNit(dto.tenantNit);
    if (!tenant) {
      throw new NotFoundError(`Company with NIT '${dto.tenantNit}'`);
    }

    if (!tenant.isActive()) {
      throw new UnauthorizedError("This company account is inactive");
    }

    // Find user within tenant
    const user = await this.userRepository.findByEmail(dto.email, tenant.id);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (!user.isActive()) {
      throw new UnauthorizedError("User account is disabled");
    }

    const passwordValid = await this.passwordService.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };

    const expiresIn = this.configService.get<string>("jwt.expiresIn") ?? "24h";
    const accessToken = this.jwtService.sign(payload, { expiresIn });

    return {
      accessToken,
      expiresIn,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantNombre: tenant.nombre,
        tenantLogo: tenant.logoUrl,
      },
    };
  }
}
