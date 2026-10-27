# Mappers

Keep in `features/<feature>/model/*mapper*.ts` (or colocated module).

```ts
export const orderMapper = {
  toModel: (dto: OrderDto): Order => ({ … }),
  toCreatePayload: (values: OrderFormValues): CreateOrderPayload => ({ … }),
  toFormValues: (order: Order): OrderFormValues => ({ … }),
}
```

## Rules

- Only when shapes differ (snake_case DTO, nested form, date coercion, …).
- No identity copy mappers.
- Do not map inside JSX deeply — call mapper at boundary (query `select`, submit handler).
