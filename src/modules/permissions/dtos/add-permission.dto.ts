import { BaseReqDto } from '@modules/common';

export class AddPermissionReqDto extends BaseReqDto {
  userGuid: string | undefined;
  permissionId: number | undefined;

  constructor(userGuid: string | undefined, permissionId: number | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
    this.permissionId = permissionId;
  }
}
