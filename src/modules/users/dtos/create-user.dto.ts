import { errorKeys } from '@exceptions';
import { BaseReqDto } from '@modules/common';
import { VALIDATOR_SETTINGS } from '@utils';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, IsStrongPassword, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString({
    message: errorKeys.users.Invalid_Email,
  })
  @IsNotEmpty({
    message: errorKeys.users.Invalid_Email,
  })
  @IsEmail(
    {},
    {
      message: errorKeys.users.Invalid_Email,
    },
  )
  @MaxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH, {
    message: errorKeys.users.Email_To_Long,
  })
  public email: string;

  @IsString({
    message: errorKeys.users.Invalid_Phone,
  })
  @IsNotEmpty({
    message: errorKeys.users.Invalid_Phone,
  })
  @IsPhoneNumber(VALIDATOR_SETTINGS.PHONE_COUNTRY_CODE, {
    message: errorKeys.users.Invalid_Phone,
  })
  @MaxLength(VALIDATOR_SETTINGS.PHONE_MAX_LENGTH, {
    message: errorKeys.users.Phone_To_Long,
  })
  public phone: string;

  @IsString({
    message: errorKeys.users.Invalid_Password,
  })
  @IsNotEmpty({
    message: errorKeys.users.Invalid_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH, {
    message: errorKeys.users.Password_To_Long,
  })
  @IsStrongPassword(VALIDATOR_SETTINGS.IS_STRONG_PASSWORD_OPTIONS, {
    message: errorKeys.users.Invalid_Password,
  })
  public password: string;
}

export class CreateUserReqDto extends BaseReqDto {
  public readonly userData: CreateUserDto;

  public constructor(userData: CreateUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.userData = userData;
  }
}
