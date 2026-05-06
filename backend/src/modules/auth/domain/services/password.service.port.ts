export const PASSWORD_SERVICE = Symbol('PasswordService');

export interface PasswordServicePort {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}
