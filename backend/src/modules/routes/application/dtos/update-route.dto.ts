import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsPositive, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RouteEstado, RouteSchedule } from '../../domain/entities/route.entity';
import { RouteStopDto } from './create-route.dto';

export class UpdateRouteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  origen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  destino?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanciaKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  horario?: RouteSchedule;

  @ApiPropertyOptional({ type: [RouteStopDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  paradas?: RouteStopDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(200)
  capacidadMaxima?: number;

  @ApiPropertyOptional({ enum: RouteEstado })
  @IsOptional()
  @IsEnum(RouteEstado)
  estado?: RouteEstado;
}
