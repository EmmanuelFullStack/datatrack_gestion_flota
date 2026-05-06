import { DatatrackUnit } from '../value-objects/datatrack-unit.vo';

export const DATATRACK_PORT = Symbol('DatatrackPort');

export interface DatatrackPort {
  /**
   * Authenticate with Datatrack and return a session ID (SID).
   * The SID is cached in Redis and refreshed automatically.
   */
  authenticate(): Promise<string>;

  /**
   * Get all units with their last known position.
   */
  getAllUnits(sid: string): Promise<DatatrackUnit[]>;

  /**
   * Get a specific unit by name pattern.
   */
  getUnitByName(sid: string, name: string): Promise<DatatrackUnit | null>;

  /**
   * Create a Datatrack locator link for a set of unit IDs.
   */
  createLocator(sid: string, unitIds: number[], note: string): Promise<string>;

  /**
   * Keep the session alive by sending a ping.
   */
  keepAlive(sid: string): Promise<void>;

  /**
   * Logout and invalidate the session.
   */
  logout(sid: string): Promise<void>;
}
