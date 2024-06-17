import { HttpException } from '@exceptions/HttpException';
import StatusCode from 'status-code-enum';

export class TranslatableHttpException extends HttpException {
  public args?: Array<string | number>;

  constructor(status: StatusCode, translationKey: string, args?: Array<string | number>) {
    super(status, translationKey);
    this.args = args;
  }
}
