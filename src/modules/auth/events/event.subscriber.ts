import { events } from '@events';
import { EventSubscriber, On } from 'event-dispatch';
import { FailedLoginAttemptEvent } from './failed-login-attempt-event';
import { InactiveUserTriesToLogInEvent } from './inactive-user-tries-to-log-in-event';
import { LockedUserTriesToLogInEvent } from './locked-user-tries-to-log-in-event';
import { UserLockedOutEvent } from './user-locked-out-event';
import { UserLoggedInEvent } from './user-logged-in-event';

@EventSubscriber()
export class LoginEventSubscriber {
  @On(events.users.userLoggedIn)
  public onLogIn(data: UserLoggedInEvent): void {
    console.log(`User ${data?.user?.email} logged in!`);
  }

  @On(events.users.inactiveUserTriesToLogIn)
  public inactiveUserTriesToLogIn(data: InactiveUserTriesToLogInEvent): void {
    console.log(`User ${data?.user?.email} logged in!`);
  }

  @On(events.users.lockedUserTriesToLogIn)
  public lockedUserTriesToLogIn(data: LockedUserTriesToLogInEvent): void {
    console.log(`User ${data?.user?.email} logged in!`);
  }

  @On(events.users.failedLoginAttempt)
  public onFailedLoginAttempt(data: FailedLoginAttemptEvent): void {
    console.log(`User ${data?.user?.email} logged in!`);
  }

  @On(events.users.userLockedOut)
  public onUserLockedOut(data: UserLockedOutEvent): void {
    console.log(`User ${data?.user?.email} logged in!`);
  }
}
