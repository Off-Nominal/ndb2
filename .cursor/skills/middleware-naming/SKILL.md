---
name: middleware-naming
description: >-
  ndb2 web Express middleware: kebab-case filenames without redundant "web" or
  "middleware" segments; camelCase exported function names. Helpers under
  middleware/auth use kebab-case. Use when adding or renaming web middleware.
---

# Web middleware naming (ndb2)

## Rules

1. **Filenames:** **`kebab-case.ts`**. Do not embed the words **`web`** or **`middleware`** in the name (the path `app/src/web/middleware/` already provides that context).
2. **Tests:** **`kebab-case.test.ts`** next to the module.
3. **Exports:** **`camelCase`** for middleware (`themePreferenceMiddleware`), getters (`getWebAuth`), etc.

## Examples

| File | Typical exports |
|------|-----------------|
| `theme-preference.ts` | `themePreferenceMiddleware`, `getThemePreference`, … |
| `error-boundary.ts` | `webErrorHandler`, `wrapWebRouteWithErrorBoundary` |
| `not-found.ts` | `webNotFoundMiddleware` |
| `auth/session.ts` | `webAuthMiddleware`, `getWebAuth`, … |
| `auth/require-auth.ts` | `requireWebAuth` |
| `auth/session-cookie-utils.ts` | `parseSessionCookie`, `SESSION_COOKIE_CONFIG`, … |

Avoid **`snake_case`** and **`PascalCase`** in filenames.

## Related

- **`middleware-patterns`** — AsyncLocalStorage, router placement.
- **`express-route-map`** — `web/routes/index.ts` mounts.
