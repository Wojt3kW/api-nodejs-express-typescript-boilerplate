import { events } from '@events';
import { EventSubscriber, On } from 'event-dispatch';
import { PermissionAddedEvent } from './permission-added-event';
import { PermissionDeletedEvent } from './permission-deleted-event';

@EventSubscriber()
export class PermissionEventSubscriber {
  @On(events.permissions.permissionAdded)
  public onPermissionAdded(data: PermissionAddedEvent): void {
    console.log(`User ${data?.currentUserId} added permission ${data?.permissionId} for user ${data?.userGuid}!`);
  }

  @On(events.permissions.permissionDeleted)
  public onPermissionDeleted(data: PermissionDeletedEvent): void {
    console.log(`User ${data?.currentUserId} deleted permission ${data?.permissionId} for user ${data?.userGuid}!`);
  }
}
