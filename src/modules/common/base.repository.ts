import DbClient from '@db/DbClient';
import { CacheService } from '@modules/common';
import { PrismaClient } from '@prisma/client';
import { Container } from 'typedi';

export abstract class BaseRepository {
  protected readonly _dbContext: PrismaClient;
  protected readonly _cacheService: CacheService;

  public constructor() {
    this._dbContext = DbClient.getDbContext();
    this._cacheService = Container.get(CacheService);
  }
}
