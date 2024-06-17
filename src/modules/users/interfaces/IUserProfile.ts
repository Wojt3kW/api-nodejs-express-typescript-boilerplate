import { IUser } from './IUser';

export interface IUserProfile extends IUser {
  firstName?: string | null;
  lastName?: string | null;
}
