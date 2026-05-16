# SmartList — Plano de Implementação

**Status:** Pré-implementação · **Workflow:** Pausar a cada fase para validação

Referências: [`SmartList_PRD_v1_2.md`](./SmartList_PRD_v1_2.md) · [`SmartList_SPEC_v1.0.md`](./SmartList_SPEC_v1.0.md) · [`CLAUDE.md`](./CLAUDE.md)

---

## Pré-flight — Credenciais Externas

| Serviço | Necessário a partir de | Status |
|---|---|---|
| Neon (PostgreSQL) | Fase 1 (TASK-006) | ✅ Disponível |
| Resend (email) | Fase 2 (TASK-012) | ⏳ Criar conta em [resend.com](https://resend.com) — plano free, 100 emails/dia |
| Upstash (Redis) | Fase 2 (TASK-011) | ✅ Disponível |
| GitHub repo | Fase 9 (TASK-043) | ⏳ Pendente |
| Vercel project | Fase 9 (TASK-044) | ⏳ Pendente |

---

## Progresso por Fase

### Fase 0 — Setup & Infraestrutura
**Entrega:** Projeto rodando em `localhost:3000`, estrutura modular, design tokens, env vars validadas, utilitários base.

- [x] **TASK-001** Scaffold Next.js + instalar dependências (shadcn, TanStack Query, Zustand, Zod, Auth.js, bcryptjs, Prisma, Upstash, Resend, react-hook-form)
- [x] **TASK-002** Estrutura de diretórios (app, modules, components, lib, prisma, tests) com placeholders
- [x] **TASK-003** Design System (fonte Inter, tokens shadcn, `src/lib/categories.ts`)
- [x] **TASK-004** Env vars + validação Zod em `src/lib/env.ts` + `.env.example`
- [x] **TASK-005** Utilitários compartilhados: `AppError`, `Errors`, `apiSuccess`, `apiError`

**Critério de saída:** `npm run dev`, `npm run build`, `npm run lint` (zero warnings) e `npm run typecheck` passam.

---

### Fase 1 — Banco de Dados & ORM
**Entrega:** Schema Prisma completo aplicado ao Neon, cliente singleton, schemas Zod compartilhados.

- [x] **TASK-006** Schema Prisma: User, PasswordResetToken, ShoppingList, Item + enum Category (7 valores)
- [x] **TASK-007** Cliente Prisma singleton em `src/lib/prisma.ts` (hot reload safe)
- [x] **TASK-008** Validators Zod compartilhados: signup, login, forgot/reset password, create/update list, create/update item

**Critério de saída:** `npx prisma migrate dev --name init` aplica ao Neon, `npx prisma generate` ok, `prisma studio` mostra as tabelas.

---

### Fase 2 — Autenticação 🚧 *requer Resend + Upstash*
**Entrega:** Auth.js v5 + middleware + signup/login/forgot/reset funcionando end-to-end.

- [x] **TASK-009** Auth.js v5 com Credentials Provider, JWT 30 dias, cookie httpOnly + middleware de proteção
- [x] **TASK-010** Use-case signup + endpoint `POST /api/v1/auth/signup` (bcrypt cost 12, 409 em email duplicado)
- [x] **TASK-011** Use-case login + rate limit (5/15min por IP+email) + bloqueio de conta após 5 falhas
- [x] **TASK-012** Forgot/reset password com token SHA-256, expiração 30min, email via Resend, rate limit 3/h
- [x] **TASK-013** Logout via `signOut` + endpoint `POST /api/v1/auth/logout`

**Critério de saída:** Fluxo completo (signup → login → forgot → reset → login com nova senha) funciona via curl.

---

### Fase 3 — API de Listas
**Entrega:** CRUD de listas com proteção IDOR e limite de 50.

- [x] **TASK-014** `requireSession()` helper em `src/modules/shared/session.ts`
- [x] **TASK-015** `shoppingListRepo` + `GET/POST /api/v1/lists` (limite 50, payload com totalItems/checkedItems)
- [x] **TASK-016** `PATCH /api/v1/lists/:id` (renomear, IDOR-safe)
- [x] **TASK-017** `DELETE /api/v1/lists/:id` (cascade delete dos itens)

**Critério de saída:** User A não acessa lista de User B (404), limite de 50 retorna 422.

---

### Fase 4 — API de Itens
**Entrega:** CRUD de itens unificado, limite de 200, rate limit de mutations.

- [x] **TASK-018** `itemRepo` + `GET/POST /api/v1/lists/:id/items` (ordem checked asc + createdAt asc)
- [x] **TASK-019** `PATCH /api/v1/items/:id` (endpoint unificado: nome, qtd, categoria, checked)
- [x] **TASK-020** `DELETE /api/v1/items/:id`
- [x] **TASK-021** Rate limit de mutations (100/min por usuário) com header `Retry-After`

**Critério de saída:** Toggle de `checked` reordena o `GET /items`, rate limit retorna 429.

---

### Fase 5 — Frontend de Auth
**Entrega:** Telas `/login`, `/signup`, `/forgot-password`, `/reset-password` com validação inline.

- [x] **TASK-022** Layout `(auth)` centralizado, responsivo 320px+
- [x] **TASK-023** Página `/signup` (react-hook-form + zodResolver, login automático pós-cadastro)
- [x] **TASK-024** Página `/login` (erros genéricos, persistência 30 dias)
- [x] **TASK-025** Página `/forgot-password` (toast genérico sempre)
- [x] **TASK-026** Página `/reset-password` (token via query string)

**Critério de saída:** CS-06, CS-07, CS-08 verificáveis manualmente em 375px.

---

### Fase 6 — Frontend de Listas
**Entrega:** Tela `/lists` com cards, modal de criar/editar, confirmação de exclusão.

- [x] **TASK-027** Layout autenticado: header + logout + FAB
- [x] **TASK-028** Tela `/lists` com `ListCard` (progresso visual) + estado vazio
- [x] **TASK-029** Modal de criar/editar lista via `Dialog` shadcn (optimistic update)
- [x] **TASK-030** Confirmação de exclusão via `AlertDialog` shadcn

**Critério de saída:** CS-01 (criar lista em ≤ 3 toques).

---

### Fase 7 — Frontend de Itens *(fase mais complexa)*
**Entrega:** Tela `/lists/[id]` com input rápido, toggle, edição via drawer, swipe-to-delete com undo.

- [x] **TASK-031** Tela `/lists/[id]` com agrupamento Pendentes/Comprados
- [x] **TASK-032** Input de adição rápida (Enter-Enter-Enter, autofocus condicional ADR-006)
- [x] **TASK-033** Toggle de checked (área clicável ≥ 44px, animação < 300ms)
- [x] **TASK-034** Edição via `Drawer` shadcn (nome, quantidade, categoria)
- [x] **TASK-035** Swipe-to-delete com undo de 5s via `Sonner`
- [x] **TASK-036** Resiliência de rede: TanStack Query + toast de offline/reconexão

**Critério de saída:** CS-02 (5 itens em ≤ 60s), CS-03 (mudança em < 300ms).

---

### Fase 8 — Testes & QA
**Entrega:** Suíte completa unit + integration + E2E + checklists manuais.

- [ ] **TASK-037** Testes unitários Vitest (≥ 80% em `src/modules/`, Prisma mockado)
- [ ] **TASK-038** Testes de integração com testcontainers (Postgres real, todos os endpoints)
- [ ] **TASK-039** E2E Playwright em viewport 375×812 (6 fluxos obrigatórios)
- [ ] **TASK-040** Checklist de acessibilidade (Lighthouse ≥ 90, axe-core, VoiceOver)
- [ ] **TASK-041** Checklist de performance (LCP < 2.5s, TBT < 200ms, bundle analyze)
- [ ] **TASK-042** Checklist de segurança (IDOR, bcrypt cost 12, cookies seguros, mensagens genéricas)

**Critério de saída:** `npm test`, `npm run test:int`, `npx playwright test` passam 100%.

---

### Fase 9 — CI/CD & Deploy
**Entrega:** Pipeline GitHub Actions + deploy Vercel + smoke test em produção.

- [ ] **TASK-043** Workflow `.github/workflows/ci.yml` (5 gates: lint, typecheck, test, test:int, build)
- [ ] **TASK-044** Deploy Vercel (preview por PR, prod na main, env vars configuradas, região gru1)
- [ ] **TASK-045** Smoke test pós-deploy validando CS-01 → CS-08 em celular real

**Critério de saída:** Pipeline verde na main, LCP < 2s em 4G, todos os 8 CS verificados.

---

## Critérios de Sucesso do MVP (CS)

Estes 8 critérios são verificados ao final (TASK-045) e definem se o MVP está pronto:

| ID | Critério | Métrica |
|---|---|---|
| CS-01 | Criação de lista rápida | ≤ 3 toques |
| CS-02 | Adição de item fluida | 5 itens em ≤ 60s |
| CS-03 | Marcação funciona | < 300ms com feedback |
| CS-04 | Carregamento aceitável | LCP < 2s em 4G |
| CS-05 | Usabilidade mobile | Fluxo completo com uma mão, sem zoom |
| CS-06 | Sessão persistente | Sem logout em 24h |
| CS-07 | Auth amigável | Erro não trava a tela |
| CS-08 | Cadastro funcional | Novo usuário em ≤ 60s |

---

## Riscos & Mitigações

| Risco | Mitigação |
|---|---|
| Resend/Upstash não configurados ao chegar na Fase 2 | Pausar fase e criar contas (~5 min cada) |
| `next-auth@beta` quebra mid-flight | Pinar versão exata após instalar |
| Docker ausente para testcontainers (Fase 8) | Postergar `test:int` ou usar Neon branch de teste |
| Limites (50 listas / 200 itens) difíceis de testar à mão | Seed script ou fixture dedicada |

---

*Plano vivo — atualizar checkboxes conforme cada TASK conclui. Plano interno do Claude: `C:\Users\roger\.claude\plans\cozy-splashing-kernighan.md`*
