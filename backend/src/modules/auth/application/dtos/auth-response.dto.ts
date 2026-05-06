import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: string;
    nombre: string;
    email: string;
    role: string;
    tenantId: string | null;
    tenantNombre: string | null;
    tenantLogo: string | null;
  };

  @ApiProperty()
  expiresIn: string;
}
