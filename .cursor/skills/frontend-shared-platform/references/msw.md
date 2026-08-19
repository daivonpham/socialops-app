# MSW (API mocking)

## Why

Develop against unstable/missing backend; test 401/403/500/loading; offline.

## Placement

```text
features/orders/api/mocks/handlers.ts   # or shared/mocks + feature handlers
mocks/browser.ts                        # worker bootstrap (app/dev only)
```

```ts
export const orderHandlers = [
  http.get('/api/orders', () => {
    return HttpResponse.json({ data: mockOrders })
  }),
]
```

## Rules

- Handlers mirror real endpoints used by `service.ts`.
- Do not mock inside components.
- Prefer MSW over ad-hoc mocked services behind flags when possible.
- Keep mock data next to feature; delete when unused.
