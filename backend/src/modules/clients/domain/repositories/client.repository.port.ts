import { Client } from '../entities/client.entity';

export const CLIENT_REPOSITORY = Symbol('ClientRepository');

export interface ClientRepositoryPort {
  findById(id: string, tenantId: string): Promise<Client | null>;
  findAll(tenantId: string, page: number, limit: number, search?: string): Promise<{ items: Client[]; total: number }>;
  save(client: Client): Promise<Client>;
  update(client: Client): Promise<Client>;
  delete(id: string, tenantId: string): Promise<void>;
  count(tenantId: string): Promise<number>;
}
