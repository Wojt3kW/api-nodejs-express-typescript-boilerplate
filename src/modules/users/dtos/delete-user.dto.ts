import { BaseReqDto } from '@modules/common';

export class DeleteUserReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}
