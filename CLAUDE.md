# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

Pre-implementation. Only `SmartList_PRD_v1_2.md` and `SmartList_SPEC_v1.0.md` exist. Code must be built from scratch following those documents. The SPEC (`SmartList_SPEC_v1.0.md`) contains 45 tasks in 9 phases with exact acceptance criteria — use it as the implementation reference, not the PRD.

## Commands

```bash
npm run dev          # dev server on port 3000
npm run build        # production build (next build)
npm run lint         # ESLint + Prettier — zero warnings required, blocks CI
npm run typecheck    # tsc --noEmit
npm test             # Vitest unit tests (mocked DB)
npm run test:int     # Vitest integration tests (real DB via testcontainers)
npm run analyze      # bundle size analysis
```

Run `npx prisma migrate dev --name <name>` to apply schema changes. `npx prisma studio` opens a DB GUI.

## Stack

Next.js App Router + TypeScript strict · Tailwind + shadcn/ui · Prisma + PostgreSQL (Neon) · Auth.js v5 Credentials Provider · bcryptjs (cost 12) · TanStack Query v5 · Zustand · Zod · Resend (email) · Upstash Ratelimit/Redis · Vitest + Playwright

## Architecture

Modular monolith with a lightweight clean architecture (ADR-002). Business logic is isolated in domain modules, never in React components or Route Handlers.

```
src/
  app/                      # Next.js App Router — pages + API routes only
    (auth)/                 # login, signup, forgot-password, reset-password
    (app)/lists/            # authenticated app routes
    api/v1/                 # Route Handlers (thin wrappers — no business logic)
  modules/
    auth/use-cases/         # signup, login, forgot-password, reset-password logic
    shopping-list/          # use-cases/ + repository.ts
    item/                   # use-cases/ + repository.ts
    shared/
      errors.ts             # AppError class + Errors factory
      http.ts               # apiSuccess() / apiError() — all API responses go through here
      session.ts            # requireSession() — used in every protected Route Handler
      validators.ts         # shared Zod schemas (reused client + server)
  components/
    ui/                     # shadcn/ui generated components
    feature/                # domain-specific React components
  lib/
    prisma.ts               # Prisma singleton (global to survive hot reload)
    auth.ts                 # Auth.js v5 config + JWT callbacks
    rate-limit.ts           # Upstash rate limiter instances
    email.ts                # Resend integration
    env.ts                  # Zod env validation — throws on startup if vars missing
    categories.ts           # CATEGORIES const (7 entries) + CategoryKey type
```

## Key Patterns

**Every protected Route Handler must call `requireSession()`** (throws 401 if no session). No exceptions.

**All API responses use `apiSuccess()` / `apiError()`** from `src/modules/shared/http.ts`. Error format is always `{ error: { code, message } }`.

**No DB queries outside repository files.** All Prisma calls live in `src/modules/*/repository.ts`.

**Shared Zod schemas** in `src/modules/shared/validators.ts` are the single source of truth — used in both Route Handlers and React forms (`zodResolver`).

**Optimistic updates** are required for all mutations (TanStack Query). Items and lists must appear/update in < 300ms before server confirmation.

## Critical Behaviors (non-obvious)

- **Autofocus only when the list is empty** (ADR-006): the input field is always visible, but `autoFocus` is set only when `items.length === 0`. This prevents the keyboard from covering existing items on populated lists.
- **`order` field exists on `Item` but has no endpoint in MVP** (ADR-005). All items are created with `order: 0`; visual order follows `createdAt asc`. This field is reserved for Phase 2 drag-and-drop.
- **Password reset tokens stored as SHA-256 hash only** — never the raw token. The raw token is sent in the email URL; the bank stores `crypto.createHash('sha256').update(rawToken).digest('hex')`.
- **Login error messages are always generic** — `"Email ou senha incorretos."` for both wrong password and non-existent email. Same principle for forgot-password responses.
- **Item deletion uses undo pattern**: the `DELETE /api/v1/items/:id` call is delayed 5 seconds. Clicking "Desfazer" in the toast cancels the pending DELETE.
- **Items are ordered**: `checked: false` first, then `checked: true`, both by `createdAt asc`.

## Rate Limits

| Limit | Window | Key |
|---|---|---|
| Login | 5 attempts / 15 min | IP + email |
| Password reset | 3 requests / 1 hour | email |
| Mutations | 100 / 1 min | userId |

429 responses must include a `Retry-After` header.

## System Limits

50 lists per user · 200 items per list · List name 100 chars · Item name 120 chars · Quantity 1–999 · Password 8–64 chars

## Required Environment Variables

```
DATABASE_URL
AUTH_SECRET                  # ≥ 32 chars
PASSWORD_RESET_SECRET        # ≥ 32 chars
EMAIL_FROM
RESEND_API_KEY               # starts with re_
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_APP_URL
```

`src/lib/env.ts` validates all vars with Zod at startup and throws a descriptive error if any is missing.

## Localization

The app is **PT-BR only**. All user-facing strings, error messages, toasts, and email templates must be in Brazilian Portuguese. No i18n infrastructure needed.

## Implementation Order

Follow the phases in `SmartList_SPEC_v1.0.md` in order (Phase 0 → 9). Do not start a new phase before all acceptance criteria of the previous phase are green. Each TASK has a checklist of binary acceptance criteria that define "done."

## Testing Strategy

- **Unit tests** (Vitest): mock Prisma, test use-cases and validators. Target ≥ 80% coverage of `src/modules/`.
- **Integration tests** (Vitest + testcontainers): real PostgreSQL, cover all API endpoints with at least one happy + one unhappy path each.
- **E2E** (Playwright): viewport locked to 375×812px (iPhone X). Six required flows listed in TASK-039.
