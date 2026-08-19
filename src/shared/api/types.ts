/** Shared API contracts — declared ONCE here; feature api/types.ts only add domain shapes. */

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
}

/** Envelope the backend wraps around every response. */
export interface CommonApiResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
  metadata?: PaginationMeta
  timestamp: string
  path: string
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
