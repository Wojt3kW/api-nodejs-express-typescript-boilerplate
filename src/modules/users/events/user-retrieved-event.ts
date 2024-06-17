import { Event } from '@events';
import { IUserProfile } from '../interfaces/IUserProfile';

export class UserRetrievedEvent extends Event {
  public readonly user: IUserProfile;

  public constructor(user: IUserProfile, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
