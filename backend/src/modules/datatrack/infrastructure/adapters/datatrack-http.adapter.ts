import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../../shared/infrastructure/redis/redis.module';
import { DatatrackPort } from '../../domain/ports/datatrack.port';
import { DatatrackUnit } from '../../domain/value-objects/datatrack-unit.vo';

const DATATRACK_SID_KEY = 'datatrack:session:sid';

@Injectable()
export class DatatrackHttpAdapter implements DatatrackPort {
  private readonly logger = new Logger(DatatrackHttpAdapter.name);
  private readonly http: AxiosInstance;
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly sessionTtl: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.baseUrl = this.configService.get<string>('datatrack.baseUrl')!;
    this.token = this.configService.get<string>('datatrack.token')!;
    this.sessionTtl = this.configService.get<number>('datatrack.sessionTtl')!;

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 10_000,
    });
  }

  private buildParams(params: Record<string, unknown>): string {
    return JSON.stringify(params);
  }

  async authenticate(): Promise<string> {
    // Check cache first
    const cached = await this.redis.get(DATATRACK_SID_KEY);
    if (cached) {
      this.logger.debug('Using cached Datatrack SID');
      return cached;
    }

    this.logger.log('Authenticating with Datatrack API...');
    const params = JSON.stringify({ token: this.token });
    const url = `${this.baseUrl}?svc=token/login&params=${encodeURIComponent(params)}`;

    const response = await this.http.get<{ eid?: string; error?: number }>(url);

    if (response.data.error || !response.data.eid) {
      throw new Error(`Datatrack authentication failed: error code ${response.data.error}`);
    }

    const sid = response.data.eid;
    // Store SID with TTL slightly less than Datatrack's 5-min expiry
    await this.redis.setex(DATATRACK_SID_KEY, this.sessionTtl, sid);
    this.logger.log('Datatrack authentication successful');
    return sid;
  }

  private async getValidSid(): Promise<string> {
    try {
      return await this.authenticate();
    } catch (err) {
      this.logger.error('Failed to get Datatrack SID', (err as Error).message);
      throw err;
    }
  }

  async getAllUnits(sid: string): Promise<DatatrackUnit[]> {
    const searchSpec = {
      spec: {
        itemsType: 'avl_unit',
        propName: 'sys_name',
        propValueMask: '*',
        sortType: 'sys_name',
      },
      force: 1,
      flags: 1025,
      from: 0,
      to: 0,
    };

    const params = encodeURIComponent(JSON.stringify(searchSpec));
    const url = `${this.baseUrl}?svc=core/search_items&params=${params}&sid=${encodeURIComponent(sid)}`;

    try {
      const response = await this.http.get<{ items?: any[]; error?: number }>(url);

      if (response.data.error === 1) {
        // Session expired — re-authenticate
        this.logger.warn('Datatrack session expired, re-authenticating...');
        await this.redis.del(DATATRACK_SID_KEY);
        const newSid = await this.authenticate();
        return this.getAllUnits(newSid);
      }

      if (response.data.error) {
        throw new Error(`Datatrack error code: ${response.data.error}`);
      }

      const items = response.data.items ?? [];
      return items.map((item) => DatatrackUnit.fromApiResponse(item));
    } catch (err) {
      this.logger.error('Failed to get units from Datatrack', (err as Error).message);
      return [];
    }
  }

  async getUnitByName(sid: string, name: string): Promise<DatatrackUnit | null> {
    const searchSpec = {
      spec: {
        itemsType: 'avl_unit',
        propName: 'sys_name',
        propValueMask: name,
        sortType: 'sys_name',
      },
      force: 1,
      flags: 1025,
      from: 0,
      to: 0,
    };

    const params = encodeURIComponent(JSON.stringify(searchSpec));
    const url = `${this.baseUrl}?svc=core/search_items&params=${params}&sid=${encodeURIComponent(sid)}`;

    try {
      const response = await this.http.get<{ items?: any[] }>(url);
      const items = response.data.items ?? [];
      if (items.length === 0) return null;
      return DatatrackUnit.fromApiResponse(items[0]);
    } catch {
      return null;
    }
  }

  async createLocator(sid: string, unitIds: number[], note: string): Promise<string> {
    const locatorParams = {
      callMode: 'create',
      app: 'locator',
      at: 0,
      dur: 0,
      fl: 256,
      p: JSON.stringify({ note, zones: 1, tracks: 0 }),
      items: unitIds,
    };

    const params = encodeURIComponent(JSON.stringify(locatorParams));
    const url = `${this.baseUrl}?svc=token/update&params=${params}&sid=${encodeURIComponent(sid)}`;

    const response = await this.http.get<{ h?: string; error?: number }>(url);
    if (response.data.error || !response.data.h) {
      throw new Error(`Failed to create Datatrack locator: error ${response.data.error}`);
    }

    return `https://plataforma.datatrack.app/locator/index.html?t=${response.data.h}`;
  }

  async keepAlive(sid: string): Promise<void> {
    const params = encodeURIComponent(JSON.stringify({ type: 'type', itemsId: [], flags: 0 }));
    const url = `${this.baseUrl}?svc=core/update_data_flags&params=${params}&sid=${encodeURIComponent(sid)}`;

    try {
      await this.http.get(url);
      // Refresh TTL in Redis
      await this.redis.expire(DATATRACK_SID_KEY, this.sessionTtl);
    } catch (err) {
      this.logger.warn('Datatrack keep-alive failed', (err as Error).message);
    }
  }

  async logout(sid: string): Promise<void> {
    const url = `${this.baseUrl}?svc=core/logout&params=${encodeURIComponent('{}')}&sid=${encodeURIComponent(sid)}`;
    try {
      await this.http.get(url);
      await this.redis.del(DATATRACK_SID_KEY);
      this.logger.log('Datatrack session closed');
    } catch (err) {
      this.logger.warn('Datatrack logout failed', (err as Error).message);
    }
  }

  /**
   * Public helper: get a fresh SID, re-authenticating if needed.
   */
  async getSid(): Promise<string> {
    return this.getValidSid();
  }
}
