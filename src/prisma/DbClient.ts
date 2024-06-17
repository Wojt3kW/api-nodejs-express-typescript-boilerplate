import { PrismaClient } from '@prisma/client';

class DbClient {
  private static instance: any | undefined = undefined;

  private readonly _prisma: PrismaClient;

  private constructor() {
    this._prisma = new PrismaClient();
  }

  private static readonly getInstance = (): DbClient => {
    if (DbClient.instance === undefined) {
      DbClient.instance = new DbClient();
    }

    return DbClient.instance;
  };

  public static getDbContext(): PrismaClient {
    return DbClient.getInstance()._prisma;
  }
}

export default DbClient;
