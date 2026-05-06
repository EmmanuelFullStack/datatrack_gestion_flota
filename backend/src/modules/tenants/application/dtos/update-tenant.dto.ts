import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';
import { PlanSuscripcion } from '../../domain/entities/tenant.entity';

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ciudad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ enum: PlanSuscripcion })
  @IsOptional()
  @IsEnum(PlanSuscripcion)
  planSuscripcion?: PlanSuscripcion;
}
