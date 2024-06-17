import StatusCode from 'status-code-enum';
import { TranslatableHttpException } from './TranslatableHttpException';
import { errorKeys } from './error.keys';

export class UnauthorizedException extends TranslatableHttpException {
  constructor(translationKey: string = errorKeys.login.User_Not_Authenticated) {
    super(StatusCode.ClientErrorUnauthorized, translationKey);
  }
}
