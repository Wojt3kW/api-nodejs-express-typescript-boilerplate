import { events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { BaseService, userToIUser, userToIUserProfile } from '@modules/common';
import {
  ActivateUserReqDto,
  CreateUserDto,
  CreateUserReqDto,
  DeactivateUserReqDto,
  DeleteUserReqDto,
  GetUserProfileReqDto,
  IUser,
  IUserProfile,
  UserActivatedEvent,
  UserCreatedEvent,
  UserDeactivatedEvent,
  UserDeletedEvent,
  UserRetrievedEvent,
  UsersRepository,
} from '@modules/users';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';

@Service()
export class UsersService extends BaseService {
  private readonly _userRepository: UsersRepository;

  public constructor() {
    super();
    this._userRepository = Container.get(UsersRepository);
  }

  public async get(reqDto: GetUserProfileReqDto): Promise<IUserProfile | null> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, [reqDto.userGuid!]);
    }

    const userProfile = userToIUserProfile(user!);

    this._eventDispatcher.dispatch(events.users.userRetrieved, new UserRetrievedEvent(userProfile, reqDto.currentUserId));

    return userProfile;
  }

  public async create(reqDto: CreateUserReqDto): Promise<IUser> {
    const userData: CreateUserDto = reqDto.userData;

    if (isNullOrEmptyString(userData?.email) || isNullOrEmptyString(userData?.phone)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.Invalid_Email_Or_Phone);
    }

    const userExists = await this._userRepository.checkIfExists({ email: userData.email, phone: userData.phone });

    if (userExists) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Already_Exists, [userData.email, userData.phone]);
    }

    if (isNullOrEmptyString(userData?.password)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.Invalid_Password);
    }

    const user = await this._userRepository.create(reqDto);
    const userDto = userToIUser(user);
    this._eventDispatcher.dispatch(events.users.userCreated, new UserCreatedEvent(userDto, reqDto.currentUserId));

    return userDto;
  }

  // public async updateUser(userId: number, userData: UpdateUserDto): Promise<IUser> {
  //   const findUser: IUser = await this.users.findUnique({ where: { id: userId } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   const hashedPassword = await hash(userData.password, 10);
  //   const updateUserData = await this.users.update({ where: { id: userId }, data: { ...userData, password: hashedPassword } });
  //   return updateUserData;
  // }

  public async delete(reqDto: DeleteUserReqDto): Promise<string | null> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, [reqDto.userGuid!]);
    }

    const relatedData: string[] = await this._userRepository.checkIfCanBeDeleted(user!.id);

    if (relatedData.length > 0) {
      throw new TranslatableHttpException(
        StatusCode.ClientErrorBadRequest,
        errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted,
        [user!.uuid].concat(relatedData),
      );
    }

    const deletedUser = await this._userRepository.delete(user!, reqDto);

    this._eventDispatcher.dispatch(events.users.userDeleted, new UserDeletedEvent(userToIUser(deletedUser!), reqDto.currentUserId));

    return deletedUser!.uuid;
  }

  public async activate(reqDto: ActivateUserReqDto): Promise<boolean> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, [reqDto.userGuid!]);
    }

    if (user!.isActive) {
      return true;
    }

    const activatedUser = await this._userRepository.activate(user!.id, reqDto);

    this._eventDispatcher.dispatch(events.users.userActivated, new UserActivatedEvent(userToIUser(activatedUser!), reqDto.currentUserId));

    return activatedUser!.isActive;
  }

  public async deactivate(reqDto: DeactivateUserReqDto): Promise<boolean> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, [reqDto.userGuid!]);
    }

    if (!user!.isActive) {
      return true;
    }

    const deactivatedUser = await this._userRepository.deactivate(user!.id, reqDto);

    this._eventDispatcher.dispatch(events.users.userDeactivated, new UserDeactivatedEvent(userToIUser(deactivatedUser!), reqDto.currentUserId));

    return !deactivatedUser!.isActive;
  }
}
