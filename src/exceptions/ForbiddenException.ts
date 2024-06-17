import StatusCode from 'status-code-enum';
import { TranslatableHttpException } from './TranslatableHttpException';
import { errorKeys } from './error.keys';

export class ForbiddenException extends TranslatableHttpException {
  constructor(translationKey: string = errorKeys.login.User_Not_Authorized) {
    super(StatusCode.ClientErrorForbidden, translationKey);
  }
}
