import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PasswordServicePort } from '../../domain/services/password.service.port';

@Injectable()
export class BcryptPasswordService implements PasswordServicePort {
  private readonly SALT_ROUNDS = 12;

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.SALT_ROUNDS);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
