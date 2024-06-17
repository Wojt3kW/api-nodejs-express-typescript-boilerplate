import { Event } from '@events';

export class PermissionDeletedEvent extends Event {
  public readonly userGuid: string | undefined;
  public readonly permissionId: number | undefined;

  public constructor(userGuid: string | undefined, permissionId: number | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
    this.permissionId = permissionId;
  }
}
