import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsArray,
  ValidateNested,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RouteEstado, RouteSchedule } from '../../domain/entities/route.entity';

export class RouteStopDto {
  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  orden: number;

  @ApiProperty({ example: 'Parada 1' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 4.7110 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -74.0721 })
  @IsNumber()
  lon: number;
}

export class CreateRouteDto {
  @ApiProperty({ example: 'Ruta Norte - Centro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({ example: 'Terminal Norte' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  origen: string;

  @ApiProperty({ example: 'Centro Histórico' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  destino: string;

  @ApiPropertyOptional({ example: 15.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanciaKm?: number;

  @ApiPropertyOptional({
    description: 'Schedule as JSON object',
    example: { diasSemana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'], horaSalida: '06:00', horaLlegada: '08:00' },
  })
  @IsOptional()
  @IsObject()
  horario?: RouteSchedule;

  @ApiPropertyOptional({
    description: 'Array of stops ordered by their sequence',
    type: [RouteStopDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  paradas?: RouteStopDto[];

  @ApiProperty({ example: 40 })
  @IsInt()
  @IsPositive()
  @Max(200)
  capacidadMaxima: number;

  @ApiPropertyOptional({ enum: RouteEstado, default: RouteEstado.ACTIVA })
  @IsOptional()
  @IsEnum(RouteEstado)
  estado?: RouteEstado;
}
