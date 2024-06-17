import { Event } from '@events';
import { IUser } from '@modules/users';

export class InactiveUserTriesToLogInEvent extends Event {
  public readonly user: IUser;

  public constructor(user: IUser) {
    super();
    this.user = user;
  }
}
