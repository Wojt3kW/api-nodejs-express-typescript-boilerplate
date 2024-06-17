import { App } from '@/app';
import DbClient from '@db/DbClient';
import { LoginDto } from '@modules/auth';
import { SystemPermission } from '@modules/permissions';
import { UsersRoute } from '@modules/users';
import { loginAs } from '@modules/users/tests/user-tests.helpers';
import { Prisma, User } from '@prisma/client';
import { getAdminLoginData } from '@utils/tests.utils';
import request from 'supertest';

describe('Cache user data tests', () => {
  let usersRoute: UsersRoute;
  let app: App;
  let findUniqueFn: any;
  let adminAuthToken: string | undefined;
  let adminUuid: string | undefined;

  beforeAll(async () => {
    jest.resetAllMocks();

    findUniqueFn = jest.fn().mockImplementation(async () => {
      return await ({
        _is_from_mock_: true,
        id: 1,
        uuid: adminUuid,
        isActive: true,
      } as unknown as Prisma.Prisma__UserClient<User>);
    });

    const dbMock = {
      user: {
        findUnique: findUniqueFn,
        count: () => {
          return 1;
        },
        findMany: () => {
          return [
            {
              _is_from_mock_: true,
              id: 1,
              uuid: '2eaa394a-649d-44c1-b797-4a9e4ed2f836',
              salt: '22fae28a2abbb54a638cb5b7f1acb2e9',
              password: '0054475aec0228265ef119a559090cf84fe6a986ce5fa6a621ea22d965087408aaab71efcb84eff4df5106bdd8304b0b8e446ff3ebdd555b588549e586df5c52',
              isActive: true,
            },
          ];
        },
        update: () => {
          return { _is_from_mock_: true };
        },
      },
      userSystemPermission: {
        findMany: () => {
          return [{ _is_from_mock_: true, userId: 1, permissionId: SystemPermission.PreviewUserProfile }];
        },
      },
    };

    DbClient.getDbContext = jest.fn().mockImplementation(() => {
      return dbMock;
    });

    usersRoute = new UsersRoute();
    app = new App([usersRoute]);
    const { email: login, password } = getAdminLoginData();
    const adminAuth = await loginAs(app, { login, password } satisfies LoginDto);
    adminAuthToken = adminAuth.authToken;
    adminUuid = adminAuth.userLoggedIn?.uuid;
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });

  it('Should store userId', async () => {
    let response = await request(app.getServer()).get(`${usersRoute.path}/${adminUuid}`).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(200);

    response = await request(app.getServer()).get(`${usersRoute.path}/${adminUuid}`).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(200);

    expect(findUniqueFn).toHaveBeenCalledTimes(5);
  });
});
