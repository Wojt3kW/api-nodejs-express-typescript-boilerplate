import * as crypto from 'crypto';
import { Service } from 'typedi';
import { isNullOrEmptyString } from './../../../utils/strings.utils';

@Service()
export class CryptoService {
  public hashPassword(salt: string, password: string): string {
    if (isNullOrEmptyString(salt) || isNullOrEmptyString(password)) {
      throw new Error('Salt and password are required to hash a password');
    }

    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  public passwordMatches(password: string, salt: string, hashedPassword: string): boolean {
    return this.hashPassword(salt, password) === hashedPassword;
  }

  public generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
