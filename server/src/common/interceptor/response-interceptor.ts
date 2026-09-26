import { Elysia } from 'elysia';

import { ApiException } from '../exception/api-exception';
import { ApiResponse } from '../response/api-response';

export const responseInterceptor = new Elysia({ name: 'response-interceptor' })
  .onAfterHandle({ as: 'global' }, ({ responseValue }) => {
    if (responseValue instanceof Response) {
      return responseValue;
    }

    if (responseValue instanceof ApiResponse) {
      return responseValue.toResponse();
    }

    return new ApiResponse(responseValue).toResponse();
  })
  .onError({ as: 'global' }, ({ error, set }) => {
    if (error instanceof ApiException) {
      set.status = error.status;
      return new ApiResponse(null, error.code, error.message).toResponse();
    }
  });
