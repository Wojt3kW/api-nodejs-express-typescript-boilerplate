import StatusCode from 'status-code-enum';
import { TranslatableHttpException } from './TranslatableHttpException';

export class BadRequestException extends TranslatableHttpException {
  constructor(translationKey: string, args?: Array<string | number>) {
    super(StatusCode.ClientErrorBadRequest, translationKey, args);
  }
}
