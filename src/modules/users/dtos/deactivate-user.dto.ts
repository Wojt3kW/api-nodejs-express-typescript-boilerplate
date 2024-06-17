import { BaseReqDto } from '@modules/common';

export class DeactivateUserReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}
