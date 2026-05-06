import { Injectable } from '@nestjs/common';
import { DatatrackHttpAdapter } from '../../infrastructure/adapters/datatrack-http.adapter';
import { DatatrackUnit } from '../../domain/value-objects/datatrack-unit.vo';

@Injectable()
export class GetUnitPositionsUseCase {
  constructor(private readonly datatrackAdapter: DatatrackHttpAdapter) {}

  async execute(): Promise<DatatrackUnit[]> {
    const sid = await this.datatrackAdapter.getSid();
    return this.datatrackAdapter.getAllUnits(sid);
  }
}
