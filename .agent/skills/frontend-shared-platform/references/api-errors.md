# API errors

Every failed request is read through `@/shared/api/errors` and shown through
`useApiErrorMessage` from `@/shared/hooks`. The API declares each code once in
`socialops-api/src/infrastructure/http/errors/catalog/` and the app translates
codes, never server text.

## Reading

```ts
import {
  getApiError,
  isApiErrorCode,
  isCancelledError,
  CodedError,
  parseErrorCode,
} from '@/shared/api/errors'

getApiError(error) // { kind, code, status?, message?, fields, requestId? }, never throws
isApiErrorCode(error, 'REPORT_VERSION_CONFLICT')
isApiErrorCode(error, ['GOOGLE_NOT_CONNECTED', 'GOOGLE_PERMISSION_MISSING'])
```

`getApiError` always returns a code:

| Situation                                  | `kind`      | `code`                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API envelope `{ error: { code } }`         | `api`       | the API code                                                                                                                                                                                                                                                                                                |
| Response without envelope (proxy, gateway) | `http`      | from status: 400 `VALIDATION_FAILED`, 401 `AUTHENTICATION_REQUIRED`, 403 `FORBIDDEN`, 404 `RESOURCE_NOT_FOUND`, 409 `RESOURCE_CONFLICT`, 413 `PAYLOAD_TOO_LARGE`, 415 `UNSUPPORTED_MEDIA_TYPE`, 429 `RATE_LIMIT_EXCEEDED`, 502/503/504 `SERVICE_UNAVAILABLE`, other 5xx `INTERNAL_ERROR`, else `HTTP_ERROR` |
| No response (offline, CORS, server down)   | `network`   | `NETWORK_ERROR`                                                                                                                                                                                                                                                                                             |
| Axios timeout                              | `timeout`   | `TIMEOUT`                                                                                                                                                                                                                                                                                                   |
| Aborted request                            | `cancelled` | `CANCELLED` (do not toast it)                                                                                                                                                                                                                                                                               |
| `CodedError` thrown by app code            | `unknown`   | its code                                                                                                                                                                                                                                                                                                    |
| Anything else                              | `unknown`   | `UNKNOWN`                                                                                                                                                                                                                                                                                                   |

- Branch on `code`, not on HTTP status: `isApiErrorCode(error, 'RESOURCE_NOT_FOUND')`, not `status === 404`.
- App-side failures that must reach the UI throw `new CodedError('REPORT_PDF_TIMEOUT')`, not `new Error('...')`.
- A code read from a URL or `postMessage` goes through `parseErrorCode(value, fallback)` first.

## Showing

```tsx
const { t } = useTranslation('workspaces')
const errorMessage = useApiErrorMessage('workspaces')

try {
  await createWorkspace.mutateAsync(input)
} catch (error) {
  toast.error({ title: errorMessage(error, t('toast.createError')) })
}

{
  update.isError ? (
    <Alert tone="error" title={errorMessage(update.error, t('editModal.error'))} />
  ) : null
}
```

Lookup order: `<feature>:errors.<CODE>` → `errors:codes.<CODE>` → the screen fallback → `errors:codes.UNKNOWN`.
For `UNKNOWN`, `INTERNAL_ERROR`, `HTTP_ERROR` and `VALIDATION_FAILED` the screen fallback wins, because it names the action that failed.

- Keep the screen fallback: it is the sentence users see when the code says nothing.
- Keep error state as the error value (`useState<unknown>(null)`), not a boolean, so it can be translated.
- Display stays local (toast, inline `Alert`, row message, redirect). There is no global error toast.
- Session expiry (401) stays in `shared/api/client.ts`; route-level 403 in permissions guards; retries in `QueryProvider`.

## Translations

- `src/shared/i18n/errors/{en-US,vi-VN}.ts` holds every API code and client code under `codes`.
  Adding a code to the API catalog means adding it here in both locales.
- A feature overrides wording for its screens under its own `errors.<CODE>` keys
  (for example `reports` uses neutral "channel" wording for Facebook codes, `google` explains the Drive permission).
