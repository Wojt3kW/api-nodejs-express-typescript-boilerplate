/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { AuthRoute, LoginDto, RequestWithIdentity, UserLoggedInEvent, setIdentity } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { IUser, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@utils/constants';
import { registerTestEventHandlers, testEventHandlers } from '@utils/tests-events.utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { NextFunction } from 'express';
import request from 'supertest';

describe('POST /login', () => {
  const usersRoute = new UsersRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('when login data are valid', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('(login via email and password) response should have the Set-Cookie header with the Authorization token when login data are correct', async () => {
      const { email: login, password } = getAdminLoginData();
      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ login, password } satisfies LoginDto);
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage, args: loginArgs } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(loginArgs).toBeUndefined();
      expect(userLoggedIn.email).toBe(login);
      const cookies = headers['set-cookie'];
      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies.length).toBe(1);
      const cookie = cookies[0];
      expect(cookie).toBeDefined();
      expect(cookie.length).toBeGreaterThan(1);
      const token = cookie.split(';')[0].split('=')[1];
      const req = {
        cookies: {
          Authorization: token,
        },
      };
      const next: NextFunction = jest.fn();
      await setIdentity(req as any, {} as any, next);
      expect((req as unknown as RequestWithIdentity).identity.userUuid).toEqual(userLoggedIn.uuid);
      expect((req as unknown as RequestWithIdentity).identity.hasPermissionToEditUserProfile()).toBeTruthy();
      expect(next).toHaveBeenCalled();

      // checking events running via eventDispatcher
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledWith(new UserLoggedInEvent(userLoggedIn));

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserLoggedIn].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('(login via phone and password) response should have the Set-Cookie header with the Authorization token when login data are correct', async () => {
      const { phone: login, password } = getAdminLoginData();
      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ login, password } satisfies LoginDto);
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage, args: loginArgs } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(loginArgs).toBeUndefined();
      expect(userLoggedIn.phone).toBe(login);
      const cookies = headers['set-cookie'];
      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies.length).toBe(1);
      const cookie = cookies[0];
      expect(cookie).toBeDefined();
      expect(cookie.length).toBeGreaterThan(1);
      const token = cookie.split(';')[0].split('=')[1];
      const req = {
        cookies: {
          Authorization: token,
        },
      };
      const next: NextFunction = jest.fn();
      await setIdentity(req as any, {} as any, next);
      expect((req as unknown as RequestWithIdentity).identity.userUuid).toEqual(userLoggedIn.uuid);
      expect((req as unknown as RequestWithIdentity).identity.hasPermissionToEditUserProfile()).toBeTruthy();
      expect(next).toHaveBeenCalled();

      // checking events running via eventDispatcher
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledWith(new UserLoggedInEvent(userLoggedIn));

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserLoggedIn].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });
  });

  describe('when exist more then one user with same login', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('POST /login should respond with a status code of 400 when exist more then one user with same phone', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const login = user1.phone;
      user2.phone = login;
      expect(user1.phone).toBe(user2.phone);
      expect(user1.email).not.toBe(user2.email);

      const createUser1Response = await request(app.getServer()).post(usersRoute.path).send(user1).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message } = createUser1Response.body;
      expect(newUser1Dto?.uuid).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.phone).toBe(login);

      const createUser2Response = await request(app.getServer()).post(usersRoute.path).send(user2).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message } = createUser2Response.body;
      expect(newUser2Dto?.uuid).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.phone).toBe(login);

      expect(newUser1Dto.phone).toBe(newUser2Dto.phone);

      const loginData: LoginDto = { login: user1.phone, password: user1.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      let deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser1Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser2Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
    });

    it('POST /login should respond with a status code of 400 when exist more then one user with same email', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const login = user1.email;
      user2.email = login;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(usersRoute.path).send(user1).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message } = createUser1Response.body;
      expect(newUser1Dto?.uuid).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(login);

      const createUser2Response = await request(app.getServer()).post(usersRoute.path).send(user2).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message } = createUser2Response.body;
      expect(newUser2Dto?.uuid).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(login);

      expect(newUser1Dto.email).toBe(newUser1Dto.email);

      const loginData: LoginDto = { login, password: user1.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      let deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser1Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser2Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
    });
  });

  describe('when login data are invalid', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('POST /login should respond with a status code of 400 when login is invalid', async () => {
      const model = { password: 'strongPassword1@' };

      const bodyData = [
        { ...model, login: null } satisfies LoginDto,
        { ...model, login: undefined } satisfies LoginDto,
        { ...model, login: '' } satisfies LoginDto,
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer()).post(authRoute.loginPath).send(body);
        expect(response.statusCode).toBe(400);
        const errors = (response.body.data.message as string)?.split(',');
        expect(errors.filter(x => !x.includes('Login')).length).toBe(0);
      }

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('POST /login should respond with a status code of 400 when password is invalid', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const model = { login: user.email };

      const bodyData = [
        { ...model, password: null } satisfies LoginDto,
        { ...model, password: undefined } satisfies LoginDto,
        { ...model, password: '' } satisfies LoginDto,
        { ...model, password: 'V3ry looooooooooooooooooooong passwooooooooooord!12' } satisfies LoginDto,
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer()).post(authRoute.loginPath).send(body);
        expect(response.statusCode).toBe(400);
        const errors = (response.body.data.message as string)?.split(',');
        expect(errors.filter(x => !x.includes('Password')).length).toBe(0);
      }

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('POST /login should respond with a status code of 400 when user with given email not exist', async () => {
      const user = generateValidUser();
      const loginData: LoginDto = { login: user.email, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('POST /login should respond with a status code of 400 when user with given phone not exist', async () => {
      const user = generateValidUser();
      const loginData: LoginDto = { login: user.phone, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('POST /login (via email) should respond with a status code of 400 when password is incorrect', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(usersRoute.path + '/' + newUserDto.uuid + '/' + usersRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { login: newUserDto.email, password: user.password + 'invalid_password' };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onFailedLoginAttempt,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('POST /login (via phone) should respond with a status code of 400 when password is incorrect', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(usersRoute.path + '/' + newUserDto.uuid + '/' + usersRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { login: newUserDto.phone, password: user.password + 'invalid_password' };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onFailedLoginAttempt,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('POST /login (via email) x-times should lock-out the user and should respond with a status code of 400 when password is incorrect', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(usersRoute.path + '/' + newUserDto.uuid + '/' + usersRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { login: newUserDto.email, password: user.password + 'invalid_password' };

      for (let index = 1; index <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        const body = loginResponse.body;
        expect(typeof body).toBe('object');
        const data = body.data;
        const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
        expect(loginArgs).toBeUndefined();
      }

      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Locked_Out);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserLockedOut,
              testEventHandlers.lockedUserTriesToLogIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS);
      expect(testEventHandlers.lockedUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('POST /login (via phone) x-times should lock-out the user and should respond with a status code of 400 when password is incorrect', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(usersRoute.path + '/' + newUserDto.uuid + '/' + usersRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { login: newUserDto.phone, password: user.password + 'invalid_password' };

      for (let index = 1; index <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        const body = loginResponse.body;
        expect(typeof body).toBe('object');
        const data = body.data;
        const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
        expect(loginArgs).toBeUndefined();
      }

      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Locked_Out);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserLockedOut,
              testEventHandlers.lockedUserTriesToLogIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS);
      expect(testEventHandlers.lockedUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('when user is not active', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('POST /login should respond with a status code of 400 when user is not active and password is correct', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateResponse = await request(app.getServer())
        .post(usersRoute.path + '/' + newUserDto.uuid + '/' + usersRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deactivateResponse.statusCode).toBe(200);

      const loginData: LoginDto = { login: newUserDto.email, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Not_Active);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserDeactivated,
              testEventHandlers.inactiveUserTriesToLogIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeactivated).not.toHaveBeenCalled();
      expect(testEventHandlers.inactiveUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('POST /login should respond with a status code of 400 when user is not active and password is incorrect', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateResponse = await request(app.getServer())
        .post(usersRoute.path + '/' + newUserDto.uuid + '/' + usersRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deactivateResponse.statusCode).toBe(200);

      const loginData: LoginDto = { login: newUserDto.email, password: user.password + 'invalid-password' };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Not_Active);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserDeactivated,
              testEventHandlers.inactiveUserTriesToLogIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeactivated).not.toHaveBeenCalled();
      expect(testEventHandlers.inactiveUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('when user is deleted', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('POST /login should respond with a status code of 400 when user is deleted', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      const loginData: LoginDto = { login: newUserDto.email, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});
