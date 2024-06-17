import { events } from '@events';
import { EventSubscriber, On } from 'event-dispatch';
import { UserActivatedEvent } from '../events/user-activated-event';
import { UserCreatedEvent } from '../events/user-created-event';
import { UserDeactivatedEvent } from '../events/user-deactivated-event';
import { UserDeletedEvent } from '../events/user-deleted-event';
import { UserRetrievedEvent } from '../events/user-retrieved-event';

@EventSubscriber()
export class UserEventSubscriber {
  @On(events.users.userRetrieved)
  public onUserRetrieved(data: UserRetrievedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) created!`);
  }

  @On(events.users.userCreated)
  public onUserCreated(data: UserCreatedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) created!`);
  }

  @On(events.users.userDeleted)
  public onUserDeleted(data: UserDeletedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) deleted!`);
  }

  @On(events.users.userActivated)
  public onUserActivated(data: UserActivatedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) activated!`);
  }

  @On(events.users.userDeactivated)
  public onUserDeactivated(data: UserDeactivatedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) deactivated!`);
  }
}
