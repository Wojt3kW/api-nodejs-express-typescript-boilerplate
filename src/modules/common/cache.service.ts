import { User } from '@db/DbModels';
import { isGuid } from '@utils';
import { CacheContainer } from 'node-ts-cache';
import { MemoryStorage } from 'node-ts-cache-storage-memory';
import { Service } from 'typedi';

@Service()
export class CacheService {
  private readonly cache: CacheContainer;

  public constructor() {
    this.cache = new CacheContainer(new MemoryStorage());
  }

  public async getUserIdFromCacheAsync(userGuid: string | null | undefined): Promise<number | undefined> {
    if (!isGuid(userGuid)) {
      return undefined;
    }

    const cacheKey = this.getUserIdCacheKey(userGuid!);
    return await this.getDataFromCache<number | undefined>(cacheKey);
  }

  public async saveUserIdInCacheAsync(user: User | undefined): Promise<void> {
    if (!isGuid(user?.uuid)) {
      return;
    }

    const cacheKey = this.getUserIdCacheKey(user!.uuid);
    await this.saveDataInCache(cacheKey, user!.id, { isCachedForever: true });
  }

  private getUserIdCacheKey(uuid: string): string {
    return `user_id_${uuid}`;
  }

  private async getDataFromCache<T>(keyName: string): Promise<T | undefined> {
    return await this.cache.getItem<T | undefined>(keyName);
  }

  private async saveDataInCache(keyName: string, data: any, options: { ttl?: number; isLazy?: boolean; isCachedForever?: boolean }): Promise<void> {
    await this.cache.setItem(keyName, data, options);
  }
}
