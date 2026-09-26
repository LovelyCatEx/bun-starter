import { ApiException } from './api-exception';

export class BusinessException extends ApiException {
  constructor(message: string, code = 1, status = 400) {
    super(status, code, message);
    this.name = 'BusinessException';
  }
}
