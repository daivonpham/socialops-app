/** Shared API contracts — declared ONCE here; feature api/types.ts only add domain shapes. */

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPage: number
}

/** Envelope the backend wraps around every response. */
export interface CommonApiResponse<T> {
  data: T
  metadata?: { pagination: PaginationMeta }
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    fields?: Array<{ field: string; code: string; message?: string }>
  }
  requestId: string
}

/** Base params accepted by almost every list endpoint. */
export type ListQueryBase = {
  page?: number
  pageSize?: number
  keyword?: string
  fromDate?: string
  toDate?: string
}

export type ListQuery<TExtra = object> = ListQueryBase & TExtra
