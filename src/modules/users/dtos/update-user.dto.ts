import { BaseReqDto } from '@modules/common';

export class UpdateUserDto {
  public isActive?: boolean;
  public failedLoginAttempts?: number;
  public isLockedOut?: boolean;
}

export class UpdateUserReqDto extends BaseReqDto {
  public readonly userId: number;
  public readonly userData: UpdateUserDto;

  public constructor(userId: number, userData: UpdateUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.userId = userId;
    this.userData = userData;
  }
}
