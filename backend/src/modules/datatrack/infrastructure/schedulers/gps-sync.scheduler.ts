import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SyncPassengerGpsUseCase } from '../../application/use-cases/sync-passenger-gps.use-case';
import { GpsGateway } from '../gateways/gps.gateway';

@Injectable()
export class GpsSyncScheduler {
  private readonly logger = new Logger(GpsSyncScheduler.name);

  constructor(
    private readonly syncUseCase: SyncPassengerGpsUseCase,
    private readonly gpsGateway: GpsGateway,
  ) {}

  @Cron('*/30 * * * * *')
  async syncGps(): Promise<void> {
    this.logger.debug('Running GPS sync...');
    try {
      const results = await this.syncUseCase.executeForAllTenants();
      for (const result of results) {
        if (result.events.length > 0) {
          this.gpsGateway.broadcastGpsUpdate(result.tenantId, result.events);
        }
      }
    } catch (err) {
      this.logger.error('GPS sync scheduler error', (err as Error).message);
    }
  }

  /** Every 15 minutes: reset passengers in LLEGO for more than 60 min → PENDIENTE */
  @Cron('0 */15 * * * *')
  async resetStaleLlego(): Promise<void> {
    try {
      await this.syncUseCase.resetLlegoToPendiente(60);
    } catch (err) {
      this.logger.error('LLEGO reset scheduler error', (err as Error).message);
    }
  }
}
