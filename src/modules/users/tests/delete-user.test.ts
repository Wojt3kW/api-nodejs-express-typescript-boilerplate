import { App } from '@/app';
import { relatedDataNames } from '@db/DbModels';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermission } from '@modules/permissions';
import { IUser, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { registerTestEventHandlers, testEventHandlers } from '@utils/tests-events.utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('DELETE/users should respond with a status code of 200', () => {
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

  test('when data are valid and logged user has permission', async () => {
    const user = generateValidUser();
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createUserResponse.body;
    expect(newUserDto?.uuid).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + newUserDto.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(newUserDto.uuid);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers)
      .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
    expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
  });

  test('when a user have ony of system permissions granted by another user', async () => {
    const requestData = generateValidUser();

    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(requestData)
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    expect(typeof body).toBe('object');
    const { data: user, message: createMessage }: { data: IUser; message: string } = body;
    expect(user?.uuid).toBeDefined();
    expect(user?.email).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const path = permissionsRoute.path + '/' + user.uuid + '/' + SystemPermission.PreviewUserList.toString();
    const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(addPermissionResponse.statusCode).toBe(201);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermissionResult, message: addPermissionMessage }: { data: boolean; message: string } = body;
    expect(addPermissionResult).toBe(true);
    expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

    const deleteUserWithSystemPermissionResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteUserWithSystemPermissionResponse.statusCode).toBe(200);
    expect(deleteUserWithSystemPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserWithSystemPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
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
    expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
  });

  test('when a user have ony of system permissions granted by himself', async () => {
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

    const deleteUserWithSystemPermissionResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteUserWithSystemPermissionResponse.statusCode).toBe(200);
    expect(deleteUserWithSystemPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserWithSystemPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(user.uuid);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers)
      .filter(
        ([, eventHandler]) =>
          ![
            testEventHandlers.onUserCreated,
            testEventHandlers.onUserActivated,
            testEventHandlers.onUserDeleted,
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
    expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE/users should respond with a status code of 403', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

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
    const userId: string = Guid.EMPTY;
    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + userId)
      .send();
    expect(deleteResponse.statusCode).toBe(403);
    const body = deleteResponse.body;
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
    expect(typeof body).toBe('object');
    const { data: user, message: createMessage }: { data: IUser; message: string } = body;
    expect(user?.uuid).toBeDefined();
    expect(user?.email).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const activateNewUserResponse = await request(app.getServer())
      .post(usersRoute.path + '/' + user.uuid + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(activateNewUserResponse.statusCode).toBe(200);

    const newUserAuthToken = (await loginAs(app, { login: requestData.email, password: requestData.password } satisfies LoginDto)).authToken;

    let deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${newUserAuthToken}`);
    expect(deleteResponse.statusCode).toBe(403);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

    deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
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

describe('DELETE/users should respond with a status code of 400', () => {
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

  test('DELETE/users should respond with a status code of 400 when user not exist', async () => {
    const userId: string = Guid.EMPTY;
    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + userId)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(400);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    const { message: deleteMessage, args: deleteArgs }: { message: string; args: string[] } = data;
    expect(deleteMessage).toBe(errorKeys.users.User_Does_Not_Exist);
    expect(deleteArgs.length).toBe(1);
    expect(deleteArgs[0]).toBe(userId);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  test('when a user has granted ony of system permissions to another users', async () => {
    const user1RequestData = generateValidUser();

    let createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(user1RequestData)
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    const { data: user1 }: { data: IUser } = body;
    expect(user1?.uuid).toBeDefined();

    let activateUserResponse = await request(app.getServer())
      .post(usersRoute.path + '/' + user1.uuid + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(activateUserResponse.statusCode).toBe(200);

    let path = permissionsRoute.path + '/' + user1.uuid + '/' + SystemPermission.AddPermission.toString();
    const user1AddPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(user1AddPermissionResponse.statusCode).toBe(201);
    expect(user1AddPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = user1AddPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermission1Result, message: addPermission1Message }: { data: boolean; message: string } = body;
    expect(addPermission1Result).toBe(true);
    expect(addPermission1Message).toBe(events.permissions.permissionAdded);

    const user2RequestData = generateValidUser();

    createUserResponse = await request(app.getServer()).post(usersRoute.path).send(user2RequestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    body = createUserResponse.body;
    const { data: user2 }: { data: IUser } = body;
    expect(user2?.uuid).toBeDefined();

    activateUserResponse = await request(app.getServer())
      .post(usersRoute.path + '/' + user2.uuid + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(activateUserResponse.statusCode).toBe(200);

    const user1AuthToken = (await loginAs(app, { login: user1RequestData.email, password: user1RequestData.password } satisfies LoginDto))
      .authToken;

    path = permissionsRoute.path + '/' + user2.uuid + '/' + SystemPermission.PreviewUserList.toString();
    const user2AddPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${user1AuthToken}`);
    expect(user2AddPermissionResponse.statusCode).toBe(201);
    expect(user2AddPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = user2AddPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermission2Result, message: addPermission2Message }: { data: boolean; message: string } = body;
    expect(addPermission2Result).toBe(true);
    expect(addPermission2Message).toBe(events.permissions.permissionAdded);

    let deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user1.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteUserResponse.statusCode).toBe(400);
    expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserResponse.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    const { message: deleteUserMessage, args: deleteUserArgs }: { message: string; args: string[] } = data;
    expect(deleteUserMessage).toBe(errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted);
    expect(deleteUserArgs).toEqual([user1.uuid, relatedDataNames.SystemPermission_AssignedBy]);

    path = permissionsRoute.path + '/' + user1.uuid;
    let deleteAllPermissionsResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteAllPermissionsResponse.statusCode).toBe(200);

    path = permissionsRoute.path + '/' + user2.uuid;
    deleteAllPermissionsResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteAllPermissionsResponse.statusCode).toBe(200);

    deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user1.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteUserResponse.statusCode).toBe(200);

    deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user2.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteUserResponse.statusCode).toBe(200);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers)
      .filter(
        ([, eventHandler]) =>
          ![
            testEventHandlers.onUserCreated,
            testEventHandlers.onUserActivated,
            testEventHandlers.onUserDeleted,
            testEventHandlers.onPermissionAdded,
            testEventHandlers.onPermissionDeleted,
            testEventHandlers.onUserLoggedIn,
          ].includes(eventHandler),
      )
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
    expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
    expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    expect(testEventHandlers.onPermissionDeleted).toHaveBeenCalled();
    expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE/users should respond with a status code of 404', () => {
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

  test('DELETE/users should respond with a status code of 404 when user Id is not GUID', async () => {
    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/invalid-guid')
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(404);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { message: deleteMessage }: { message: string } = body;
    expect(deleteMessage).toBe(errorKeys.general.Page_Does_Not_Exist);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE/users should respond with a status code of 401', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

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
    const userId: string = Guid.EMPTY;
    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + userId)
      .send()
      .set('Authorization', `Bearer invalid_token_${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(401);
    const body = deleteResponse.body;
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
