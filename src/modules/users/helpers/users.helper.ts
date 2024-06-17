import { User } from '@db/DbModels';
import { IUser, IUserProfile } from '@modules/users';

export function userToIUser(user: User): IUser {
  return {
    uuid: user.uuid,
    email: user.email,
    phone: user.phone,
  } satisfies IUser;
}

export function userToIUserProfile(user: User): IUserProfile {
  return {
    uuid: user.uuid,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
  } satisfies IUserProfile;
}
