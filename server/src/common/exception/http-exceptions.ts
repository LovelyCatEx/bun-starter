import { ApiException } from './api-exception';

export class BadRequestException extends ApiException {
  constructor(message = 'Bad Request', code = 400) {
    super(400, code, message);
    this.name = 'BadRequestException';
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message = 'Unauthorized', code = 401) {
    super(401, code, message);
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends ApiException {
  constructor(message = 'Forbidden', code = 403) {
    super(403, code, message);
    this.name = 'ForbiddenException';
  }
}

export class NotFoundException extends ApiException {
  constructor(message = 'Not Found', code = 404) {
    super(404, code, message);
    this.name = 'NotFoundException';
  }
}

export class ConflictException extends ApiException {
  constructor(message = 'Conflict', code = 409) {
    super(409, code, message);
    this.name = 'ConflictException';
  }
}

export class InternalServerErrorException extends ApiException {
  constructor(message = 'Internal Server Error', code = 500) {
    super(500, code, message);
    this.name = 'InternalServerErrorException';
  }
}

export class ServiceUnavailableException extends ApiException {
  constructor(message = 'Service Unavailable', code = 503) {
    super(503, code, message);
    this.name = 'ServiceUnavailableException';
  }
}
