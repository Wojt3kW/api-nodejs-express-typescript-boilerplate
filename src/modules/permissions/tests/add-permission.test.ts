/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import { PermissionAddedEvent, PermissionsRoute, SystemPermission } from '@modules/permissions';
import { IUser, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { registerTestEventHandlers, testEventHandlers } from '@utils/tests-events.utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('POST /permissions/userId/permissionId should respond with a status code of 404', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string | undefined;
  let userLoggedIn: IUser;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    const loginResult = await loginAs(app, { login, password } satisfies LoginDto);
    adminAuthToken = loginResult.authToken;
    userLoggedIn = loginResult.userLoggedIn!;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  it('POST /permissions/userId/permissionId should respond with a status code of 404 when userId is missing', async () => {
    const path = permissionsRoute.path + '/' + SystemPermission.ActivateUser.toString();
    const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(404);
  });

  it('POST /permissions/userId/permissionId should respond with a status code of 404 when userId is invalid', async () => {
    const path = permissionsRoute.path + '/invalid-user-id/' + SystemPermission.ActivateUser.toString();
    const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(404);
  });

  it('POST /permissions/userId/permissionId should respond with a status code of 404 when permissionId is missing', async () => {
    const path = permissionsRoute.path + '/' + userLoggedIn.uuid;
    const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(404);
  });

  it('POST /permissions/userId/permissionId should respond with a status code of 404 when permissionId is invalid', async () => {
    const path = permissionsRoute.path + '/' + userLoggedIn.uuid + '/invalid-permission-id';
    const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(404);
  });

  it('POST /permissions/userId/permissionId should respond with a status code of 404 when userId and permissionId are missing', async () => {
    const path = permissionsRoute.path;
    const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(404);
  });

  it('POST /permissions/userId/permissionId should respond with a status code of 404 when userId and permissionId are invalid', async () => {
    const path = permissionsRoute.path + '/invalid-user-id/invalid-permission-id';
    const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(404);
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('POST /permissions/userId/permissionId should respond with a status code of 400', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  test('POST /permissions/userId/permissionId should respond with a status code of 400 when user not exist', async () => {
    const path = permissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermission.ActivateUser.toString();
    const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = response.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    expect(data).toBe(false);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  test('POST /permissions/userId/permissionId should respond with a status code of 400 when permission not exist', async () => {
    const newUser = generateValidUser();
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(newUser).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    const { data: newUserDto }: { data: IUser } = createUserResponse.body;
    expect(newUserDto?.uuid).toBeDefined();

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + newUserDto.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(200);

    const path = permissionsRoute.path + '/' + newUserDto.uuid + '/' + (SystemPermission.PreviewUserList - 1).toString();
    const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(addPermissionResponse.statusCode).toBe(400);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    expect(data).toBe(false);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers)
      .filter(
        ([, eventHandler]) =>
          ![testEventHandlers.onUserCreated, testEventHandlers.onUserRetrieved, testEventHandlers.onUserDeleted].includes(eventHandler),
      )
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('POST /permissions/userId/permissionId should respond with a status code of 401', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  test('when token is invalid', async () => {
    const path = permissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermission.PreviewUserList.toString();
    const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer invalid_token_${adminAuthToken}`);
    expect(addPermissionResponse.statusCode).toBe(401);
    const body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.Wrong_Authentication_Token);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('POST /permissions/userId/permissionId should respond with a status code of 403', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  test('when token is not set', async () => {
    const path = permissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermission.PreviewUserList.toString();
    const addPermissionResponse = await request(app.getServer()).post(path).send();
    expect(addPermissionResponse.statusCode).toBe(403);
    const body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  test('when user have no permission', async () => {
    const requestData = generateValidUser();

    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(requestData)
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    const { data: user }: { data: IUser } = body;
    expect(user?.uuid).toBeDefined();

    const activateNewUserResponse = await request(app.getServer())
      .post(usersRoute.path + '/' + user.uuid + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(activateNewUserResponse.statusCode).toBe(200);

    const newUserAuthToken = (await loginAs(app, { login: requestData.email, password: requestData.password } satisfies LoginDto)).authToken;

    const path = permissionsRoute.path + '/' + user.uuid + '/' + SystemPermission.PreviewUserList.toString();
    const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAuthToken}`);
    expect(addPermissionResponse.statusCode).toBe(403);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

    const deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteUserResponse.statusCode).toBe(200);
    expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid }: { data: string } = body;
    expect(deletedUserUuid).toBe(user.uuid);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers)
      .filter(
        ([, eventHandler]) =>
          ![
            testEventHandlers.onUserCreated,
            testEventHandlers.onUserActivated,
            testEventHandlers.onUserLoggedIn,
            testEventHandlers.onUserDeleted,
          ].includes(eventHandler),
      )
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
    expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
    expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
    expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('POST /permissions/userId/permissionId should respond with a status code of 200', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  test('when user have permissions to add systemPermission', async () => {
    const requestData = generateValidUser();

    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(requestData)
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    const { data: user }: { data: IUser } = body;
    expect(user?.uuid).toBeDefined();

    const activateNewUserResponse = await request(app.getServer())
      .post(usersRoute.path + '/' + user.uuid + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(activateNewUserResponse.statusCode).toBe(200);

    let path = permissionsRoute.path + '/' + user.uuid + '/' + SystemPermission.AddPermission.toString();
    let addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(addPermissionResponse.statusCode).toBe(201);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermission1Result, message: addPermission1Message }: { data: boolean; message: string } = body;
    expect(addPermission1Result).toBe(true);
    expect(addPermission1Message).toBe(events.permissions.permissionAdded);

    const newUserAuthToken = (await loginAs(app, { login: requestData.email, password: requestData.password } satisfies LoginDto)).authToken;

    path = permissionsRoute.path + '/' + user.uuid + '/' + SystemPermission.PreviewUserList.toString();
    addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAuthToken}`);
    expect(addPermissionResponse.statusCode).toBe(201);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermission2Result, message: addPermission2Message }: { data: boolean; message: string } = body;
    expect(addPermission2Result).toBe(true);
    expect(addPermission2Message).toBe(events.permissions.permissionAdded);

    const deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteUserResponse.statusCode).toBe(200);
    expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid }: { data: string } = body;
    expect(deletedUserUuid).toBe(user.uuid);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers)
      .filter(
        ([, eventHandler]) =>
          ![
            testEventHandlers.onUserCreated,
            testEventHandlers.onUserDeleted,
            testEventHandlers.onUserActivated,
            testEventHandlers.onPermissionAdded,
            testEventHandlers.onUserLoggedIn,
          ].includes(eventHandler),
      )
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
    expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
    expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
    expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
  });

  test('when the user to whom we grant permissions already has this permission', async () => {
    const requestData = generateValidUser();

    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(requestData)
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    const { data: user }: { data: IUser } = body;
    expect(user?.uuid).toBeDefined();

    const path = permissionsRoute.path + '/' + user.uuid + '/' + SystemPermission.PreviewUserList.toString();
    const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(addPermissionResponse.statusCode).toBe(201);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermissionResult, message: addPermissionMessage }: { data: boolean; message: string } = body;
    expect(addPermissionResult).toBe(true);
    expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

    const addPermissionAgainResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(addPermissionAgainResponse.statusCode).toBe(201);
    expect(addPermissionAgainResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionAgainResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermissionAgainResult, message: addPermissionAgainMessage }: { data: boolean; message: string } = body;
    expect(addPermissionAgainResult).toBe(true);
    expect(addPermissionAgainMessage).toBe(events.permissions.permissionAdded);

    const deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteUserResponse.statusCode).toBe(200);
    expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid }: { data: string } = body;
    expect(deletedUserUuid).toBe(user.uuid);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers)
      .filter(
        ([, eventHandler]) =>
          ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted, testEventHandlers.onPermissionAdded].includes(eventHandler),
      )
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
    expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    expect(testEventHandlers.onPermissionAdded).toHaveBeenCalledWith(new PermissionAddedEvent(user.uuid, SystemPermission.PreviewUserList, 1));
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});
