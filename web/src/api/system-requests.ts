import type { ApiResponse } from '@shared/protocol/api-response'
import { CODE_OK } from '@shared/protocol/api-response'

import {
  doDelete,
  doGet,
  doPatch,
  doPost,
  doPut,
  type RequestConfig,
} from './requests'

async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const envelope = await promise

  if (envelope.code !== CODE_OK) {
    throw new Error(envelope.message || 'Request failed')
  }

  return envelope.data
}

export function get<T>(url: string, config?: RequestConfig): Promise<T> {
  return unwrap(doGet<ApiResponse<T>>(url, config))
}

export function post<T>(
  url: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<T> {
  return unwrap(doPost<ApiResponse<T>>(url, body, config))
}

export function put<T>(
  url: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<T> {
  return unwrap(doPut<ApiResponse<T>>(url, body, config))
}

export function patch<T>(
  url: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<T> {
  return unwrap(doPatch<ApiResponse<T>>(url, body, config))
}

export function del<T>(url: string, config?: RequestConfig): Promise<T> {
  return unwrap(doDelete<ApiResponse<T>>(url, config))
}
