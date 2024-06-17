import { SECRET_AUDIENCE, SECRET_ISSUER, SECRET_KEY } from '@config';
import { User } from '@db/DbModels';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { CryptoService, DataStoredInToken, FailedLoginAttemptEvent, InactiveUserTriesToLogInEvent, LockedUserTriesToLogInEvent, LoginDto, TokenData, UserLockedOutEvent, UserLoggedInEvent } from '@modules/auth';
import { BaseService, userToIUser } from '@modules/common';
import { PermissionsRepository, SystemPermission } from '@modules/permissions';
import { IUser, UpdateUserReqDto, UsersRepository } from '@modules/users';
import { isNullOrEmptyString } from '@utils';
import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@utils/constants';
import { sign } from 'jsonwebtoken';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';

@Service()
export class AuthService extends BaseService {
  private readonly _userRepository: UsersRepository;
  private readonly _permissionRepository: PermissionsRepository;
  private readonly _cryptoService: CryptoService;

  public constructor() {
    super();
    this._userRepository = Container.get(UsersRepository);
    this._permissionRepository = Container.get(PermissionsRepository);
    this._cryptoService = Container.get(CryptoService);
  }

  public async login(loginData: LoginDto): Promise<{ cookie: string; user: IUser }> {
    if (isNullOrEmptyString(loginData?.login) || isNullOrEmptyString(loginData?.password)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    const users: User[] = await this._userRepository.findManyByLogin(loginData.login);

    if (users?.length !== 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    const user: User = users[0];
    const userDto = userToIUser(user);

    if (!user.isActive) {
      this._eventDispatcher.dispatch(events.users.inactiveUserTriesToLogIn, new InactiveUserTriesToLogInEvent(userDto));
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.User_Is_Not_Active);
    }

    if (user.isLockedOut) {
      this._eventDispatcher.dispatch(events.users.lockedUserTriesToLogIn, new LockedUserTriesToLogInEvent(userDto));
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.User_Is_Locked_Out);
    }

    const isPasswordMatching: boolean = this._cryptoService.passwordMatches(loginData.password ?? '', user.salt, user.password);

    if (!isPasswordMatching) {
      const failedLoginAttempts = await this._userRepository.increaseFailedLoginAttempts({
        userId: user.id,
        userData: {
          failedLoginAttempts: user.failedLoginAttempts,
        },
        currentUserId: undefined,
      } satisfies UpdateUserReqDto);

      this._eventDispatcher.dispatch(events.users.failedLoginAttempt, new FailedLoginAttemptEvent(userDto));

      if (failedLoginAttempts >= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS) {
        await this._userRepository.lockOutUser({
          userId: user.id,
          userData: {
            isLockedOut: user.isLockedOut,
          },
          currentUserId: undefined,
        } satisfies UpdateUserReqDto);

        this._eventDispatcher.dispatch(events.users.userLockedOut, new UserLockedOutEvent(userDto));
      }

      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    const userPermissions = await this._permissionRepository.getUserPermissions(user.id);
    const tokenData = this.createToken(user, userPermissions);

    this._eventDispatcher.dispatch(events.users.userLoggedIn, new UserLoggedInEvent(userDto));
    return { cookie: this.createCookie(tokenData), user: userDto };
  }

  // public async logout(userData: IUser): Promise<IUser> {
  //   const findUser: IUser = await this.users.findFirst({ where: { email: userData.email, password: userData.password } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   return findUser;
  // }

  private createToken(user: IUser, permissions: SystemPermission[]): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.uuid, permissions };

    const expiresIn: number = 10 * 60; // expressed in seconds

    return {
      expiresIn,
      token: sign(dataStoredInToken, SECRET_KEY!, {
        expiresIn,
        notBefore: '0', // Cannot use before now, can be configured to be deferred.
        algorithm: 'HS256',
        audience: SECRET_AUDIENCE,
        issuer: SECRET_ISSUER,
      }),
    };
  }

  private createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}
