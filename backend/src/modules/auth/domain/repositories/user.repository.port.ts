import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('UserRepository');

export interface UserRepositoryPort {
  /** For regular users tenantId is a string; for SUPER_ADMIN pass null */
  findById(id: string, tenantId: string | null): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findByEmailGlobal(email: string): Promise<User | null>;
  findAllByTenant(tenantId: string, page: number, limit: number): Promise<{ items: User[]; total: number }>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  superAdminExists(): Promise<boolean>;
}
