import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUnitPositionsUseCase } from '../../application/use-cases/get-unit-positions.use-case';
import { CreateLocatorUseCase } from '../../application/use-cases/create-locator.use-case';
import { GetAlarmsUseCase } from '../../application/use-cases/get-alarms.use-case';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/infrastructure/jwt/jwt.strategy';
import { DatatrackUnitResponseDto, AlarmPositionResponseDto } from '../../application/dtos/datatrack-responses.dto';

@ApiTags('Datatrack GPS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('datatrack')
export class DatatrackController {
  constructor(
    private readonly getUnitPositions: GetUnitPositionsUseCase,
    private readonly createLocator: CreateLocatorUseCase,
    private readonly getAlarms: GetAlarmsUseCase,
  ) {}

  @Get('alarms')
  @ApiOperation({ summary: 'Get current positions for passengers WITHOUT an assigned route' })
  @ApiResponse({ type: [AlarmPositionResponseDto] })
  async getAlarmsPositions(@CurrentUser() user: JwtPayload): Promise<AlarmPositionResponseDto[]> {
    const alarms = await this.getAlarms.execute(user.tenantId!);
    return alarms as AlarmPositionResponseDto[]; // Mapping is implicit as fields match
  }

  @Get('units')
  @ApiOperation({ summary: 'Get all Datatrack GPS units with their current positions' })
  @ApiResponse({ type: [DatatrackUnitResponseDto] })
  async getAllUnits(): Promise<DatatrackUnitResponseDto[]> {
    const units = await this.getUnitPositions.execute();
    return units as unknown as DatatrackUnitResponseDto[];
  }

  @Post('routes/:routeId/locator')
  @ApiOperation({ summary: 'Create a Datatrack locator link for all passengers on a route' })
  async createRouteLocator(
    @CurrentUser() user: JwtPayload,
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ): Promise<{ locatorUrl: string }> {
    return this.createLocator.executeForRoute(routeId, user.tenantId!);
  }
}
