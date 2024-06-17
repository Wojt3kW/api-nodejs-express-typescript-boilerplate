import { errorKeys } from '@exceptions';
import { VALIDATOR_SETTINGS } from '@utils';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @IsString({
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH, {
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  public login: string | null | undefined;

  @IsNotEmpty({
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @IsString({
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH, {
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  public password: string | null | undefined;
}
