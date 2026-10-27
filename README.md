# SocialOps — Admin Shell

Multi-tenant social media operations admin (Workspace → Brand → Social Account).
This repo currently contains the **application shell only** — no business features.

## Stack

Vite · React 19 · TypeScript · React Router 7 (SPA) · TanStack Query 5 ·
Tailwind CSS 4 · Ant Design 5 (behind adapters only) · i18next/react-i18next ·
axios · MSW (dev mocks).

## Scripts

```bash
npm run dev      # dev server with MSW mocks
npm run build    # type-check + production build
npm run lint     # ESLint incl. architecture boundary rules
```

## Architecture (see `.agent/skills/frontend-admin-architecture`)

```text
src/
├── app/        providers, layouts, router, app-shell i18n — composes features
├── features/   workspaces, brands, social-accounts (api + components + owned i18n)
└── shared/
    ├── ui/           platform components — the ONLY UI entry for features
    ├── adapters/ant/ antd implementations — INTERNAL (see its README)
    ├── styles/       tokens.ts (single source of raw design values) + index.css
    ├── api/          axios client + CommonApiResponse/ListQueryBase
    ├── i18n/         locale engine, common resources, formatting helpers
    ├── scope/        active Workspace/Brand context (data injected by app)
    └── permissions/  catalog + hasPermission/Can engine (data injected by app)
```

Hard rules (ESLint-enforced):

- `antd`/`@ant-design/*` only in `shared/adapters/**` + `app/providers/ThemeProvider.tsx`
- features never import `@/shared/adapters/**`, `@/app/**`, or another feature's internals
- translation resources follow ownership: app shell in `app/i18n`, domain copy in
  `features/<feature>/i18n`, engine/common formatting in `shared/i18n`
- raw hex/px values exist only in `src/shared/styles/tokens.ts` (consumed by
  `tailwind.config.ts` and `shared/adapters/ant/theme.ts`); `design.md` is the source

CSS layer order (Tailwind utilities beat antd, antd beats preflight):

```css
@layer theme, base, antd, components, utilities;
```

## Mocked API (dev only)

`GET /api/workspaces`, `GET /api/workspaces/:id/brands`,
`GET /api/brands/:id` (includes per-brand permission keys),
`GET /api/brands/:id/social-accounts/counts` — data differs per brand so
switching brand visibly changes counts and nav permissions.
