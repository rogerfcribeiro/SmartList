# SmartList — Spec Técnico v1.0
**Baseado em:** PRD v1.2  
**Status:** Pronto para desenvolvimento  
**Metodologia:** Spec-Driven Development  

---

## Como usar este documento

Cada task é uma unidade de trabalho verificável. A coluna **Critérios de Aceite** define exatamente o que "pronto" significa — sem interpretação. Execute as tasks na ordem das fases. Não avance para a próxima fase sem que todos os critérios da anterior estejam verdes.

---

## Índice de Fases

| Fase | Nome | Tasks |
|------|------|-------|
| 0 | Setup & Infraestrutura | TASK-001 → TASK-005 |
| 1 | Banco de Dados & ORM | TASK-006 → TASK-008 |
| 2 | Autenticação | TASK-009 → TASK-013 |
| 3 | API — Listas | TASK-014 → TASK-017 |
| 4 | API — Itens | TASK-018 → TASK-021 |
| 5 | Frontend — Auth | TASK-022 → TASK-026 |
| 6 | Frontend — Listas | TASK-027 → TASK-030 |
| 7 | Frontend — Itens | TASK-031 → TASK-036 |
| 8 | Testes & QA | TASK-037 → TASK-042 |
| 9 | CI/CD & Deploy | TASK-043 → TASK-045 |

---

## FASE 0 — Setup & Infraestrutura

### TASK-001 — Scaffold do projeto Next.js

**Descrição:** Criar o projeto base com todas as dependências do MVP.

**Comandos:**
```bash
npx create-next-app@latest smartlist \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

**Dependências a instalar:**
```bash
# UI
npx shadcn@latest init
npx shadcn@latest add button input label dialog drawer alert-dialog card progress form select checkbox dropdown-menu sonner

# Data / State
npm install @tanstack/react-query zustand

# Validação
npm install zod

# Auth
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs

# ORM
npm install prisma @prisma/client
npx prisma init

# Rate limiting
npm install @upstash/ratelimit @upstash/redis

# Email
npm install resend

# Forms
npm install react-hook-form @hookform/resolvers
```

**Critérios de aceite:**
- [ ] `npm run dev` sobe sem erros na porta 3000
- [ ] `npm run build` conclui sem erros de TypeScript
- [ ] `npm run lint` retorna zero warnings
- [ ] Estrutura de diretórios `src/app`, `src/modules`, `src/components`, `src/lib` existe
- [ ] `tsconfig.json` tem `"strict": true`

---

### TASK-002 — Estrutura de diretórios (Clean Architecture Leve)

**Descrição:** Criar a estrutura de pastas dos módulos de domínio conforme ADR-002.

**Estrutura a criar:**
```
src/
  app/
    (auth)/
      login/
        page.tsx
      signup/
        page.tsx
      forgot-password/
        page.tsx
      reset-password/
        page.tsx
    (app)/
      lists/
        page.tsx
      lists/[id]/
        page.tsx
    api/
      v1/
        auth/
          signup/route.ts
          login/route.ts
          logout/route.ts
          forgot-password/route.ts
          reset-password/route.ts
        lists/
          route.ts
          [id]/
            route.ts
            items/
              route.ts
        items/
          [id]/
            route.ts
    layout.tsx
    globals.css
  modules/
    auth/
      use-cases/
      repository/
      types.ts
      validators.ts
    shopping-list/
      use-cases/
      repository/
      types.ts
      validators.ts
    item/
      use-cases/
      repository/
      types.ts
      validators.ts
    shared/
      errors.ts
      http.ts
      validators.ts
  components/
    ui/           ← shadcn components (gerados automaticamente)
    feature/
      auth/
      lists/
      items/
      shared/
  lib/
    prisma.ts
    auth.ts
    rate-limit.ts
    email.ts
  prisma/
    schema.prisma
    migrations/
  tests/
    unit/
    integration/
    e2e/
```

**Critérios de aceite:**
- [ ] Todos os diretórios existem no sistema de arquivos
- [ ] Cada `route.ts` exporta ao menos um handler placeholder que retorna `{ ok: true }`
- [ ] Cada `page.tsx` renderiza um `<div>` com o nome da rota (placeholder)
- [ ] `npm run build` passa com a estrutura placeholder

---

### TASK-003 — Configuração do Design System

**Descrição:** Configurar tokens de tipografia e cores conforme seção 10.1 do PRD.

**`src/app/globals.css`** — adicionar após o bloco shadcn padrão:
```css
/* Fonte principal */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --font-sans: 'Inter', system-ui, sans-serif;
}

body {
  font-family: var(--font-sans);
}
```

**`tailwind.config.ts`** — confirmar que inclui:
```ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
    },
  },
}
```

**`src/lib/categories.ts`** — enum de categorias com metadados de UI:
```ts
export const CATEGORIES = {
  HORTIFRUTI: { label: 'Hortifruti', icon: '🥦' },
  ACOUGUE:    { label: 'Açougue',    icon: '🥩' },
  PADARIA:    { label: 'Padaria',    icon: '🍞' },
  LIMPEZA:    { label: 'Limpeza',    icon: '🧹' },
  HIGIENE:    { label: 'Higiene',    icon: '🧴' },
  BEBIDAS:    { label: 'Bebidas',    icon: '🧃' },
  OUTROS:     { label: 'Outros',     icon: '📦' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
```

**Critérios de aceite:**
- [ ] Fonte Inter carregada via `next/font/google` (sem Flash of Unstyled Text)
- [ ] Variáveis CSS `--primary`, `--destructive`, `--muted-foreground`, `--accent`, `--border` definidas via shadcn
- [ ] `CATEGORIES` exporta exatamente 7 entradas
- [ ] TypeScript não emite erro em `CategoryKey`

---

### TASK-004 — Variáveis de ambiente

**Descrição:** Definir e documentar todas as env vars obrigatórias.

**`.env.local` (template — nunca commitar com valores reais):**
```env
# Banco de dados
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="gere com: openssl rand -base64 32"
PASSWORD_RESET_SECRET="gere com: openssl rand -base64 32"

# Email
EMAIL_FROM="SmartList <noreply@seudominio.com>"
RESEND_API_KEY="re_..."

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**`.env.example`** — commitar este arquivo com as chaves mas sem valores.

**`src/lib/env.ts`** — validação de env vars com Zod na inicialização:
```ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  PASSWORD_RESET_SECRET: z.string().min(32),
  EMAIL_FROM: z.string().email(),
  RESEND_API_KEY: z.string().startsWith('re_'),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

**Critérios de aceite:**
- [ ] `.env.example` commitado com todas as 8 chaves sem valores
- [ ] `.env.local` está no `.gitignore`
- [ ] `src/lib/env.ts` lança erro descritivo se qualquer var estiver ausente
- [ ] `npm run build` falha com mensagem clara se `AUTH_SECRET` for removido

---

### TASK-005 — Utilitários compartilhados

**Descrição:** Criar os utilitários base usados por todos os módulos.

**`src/modules/shared/errors.ts`:**
```ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  UNAUTHORIZED:        () => new AppError('UNAUTHORIZED', 'Não autenticado', 401),
  FORBIDDEN:           () => new AppError('FORBIDDEN', 'Acesso negado', 403),
  NOT_FOUND:           (resource: string) => new AppError(`${resource}_NOT_FOUND`, `${resource} não encontrado`, 404),
  CONFLICT:            (code: string, msg: string) => new AppError(code, msg, 409),
  VALIDATION:          (msg: string) => new AppError('VALIDATION_ERROR', msg, 422),
  RATE_LIMITED:        () => new AppError('RATE_LIMITED', 'Muitas requisições. Tente novamente em breve.', 429),
  LIST_LIMIT_REACHED:  () => new AppError('LIST_LIMIT_REACHED', 'Limite de listas atingido. Exclua uma para criar nova.', 422),
  ITEM_LIMIT_REACHED:  () => new AppError('ITEM_LIMIT_REACHED', 'Lista cheia (200 itens).', 422),
};
```

**`src/modules/shared/http.ts`:**
```ts
import { NextResponse } from 'next/server';
import { AppError } from './errors';

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode },
    );
  }
  console.error('[Unhandled API Error]', error);
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.' } },
    { status: 500 },
  );
}
```

**Critérios de aceite:**
- [ ] `AppError` é instância de `Error`
- [ ] `apiError` retorna `NextResponse` com formato `{ error: { code, message } }` para qualquer `AppError`
- [ ] `apiError` retorna 500 genérico para erros não-AppError (sem vazar stack trace)
- [ ] TypeScript compila sem erros

---

## FASE 1 — Banco de Dados & ORM

### TASK-006 — Schema Prisma

**Descrição:** Definir o schema completo conforme seção 7 do PRD.

**`prisma/schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Category {
  HORTIFRUTI
  ACOUGUE
  PADARIA
  LIMPEZA
  HIGIENE
  BEBIDAS
  OUTROS
}

model User {
  id                   String               @id @default(cuid())
  email                String               @unique
  passwordHash         String
  name                 String?              @db.VarChar(60)
  failedLoginAttempts  Int                  @default(0)
  lockedUntil          DateTime?
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt

  lists                ShoppingList[]
  passwordResetTokens  PasswordResetToken[]
}

model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ShoppingList {
  id        String   @id @default(cuid())
  title     String   @db.VarChar(100)
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     Item[]
}

model Item {
  id        String       @id @default(cuid())
  listId    String
  name      String       @db.VarChar(120)
  quantity  Int          @default(1)
  checked   Boolean      @default(false)
  category  Category     @default(OUTROS)
  order     Int          @default(0)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  list      ShoppingList @relation(fields: [listId], references: [id], onDelete: Cascade)
}
```

**Critérios de aceite:**
- [ ] `npx prisma validate` passa sem erros
- [ ] `npx prisma migrate dev --name init` cria migração e aplica ao banco
- [ ] `npx prisma generate` gera o client sem erros
- [ ] Enum `Category` tem exatamente 7 valores
- [ ] Cascade delete configurado: User → Lists → Items e User → PasswordResetToken
- [ ] Campo `order` existe no modelo `Item` com `default: 0`

---

### TASK-007 — Cliente Prisma (singleton)

**Descrição:** Configurar o cliente Prisma para evitar múltiplas instâncias em desenvolvimento (hot reload).

**`src/lib/prisma.ts`:**
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Critérios de aceite:**
- [ ] Import `import { prisma } from '@/lib/prisma'` funciona em qualquer módulo
- [ ] Em desenvolvimento, queries aparecem no console
- [ ] Em produção (`NODE_ENV=production`), apenas erros são logados
- [ ] Hot reload não cria múltiplas conexões (verificar via `prisma.$queryRaw('SELECT 1')`)

---

### TASK-008 — Validators Zod compartilhados

**Descrição:** Definir os schemas Zod reutilizáveis entre client e server.

**`src/modules/shared/validators.ts`:**
```ts
import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Email inválido')
  .toLowerCase()
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter ao menos 8 caracteres')
  .max(64, 'Senha deve ter no máximo 64 caracteres')
  .regex(/[a-zA-Z]/, 'Senha deve conter ao menos uma letra')
  .regex(/[0-9]/, 'Senha deve conter ao menos um número');

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().max(60).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha obrigatória'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export const createListSchema = z.object({
  title: z.string().min(1, 'Nome obrigatório').max(100),
});

export const updateListSchema = z.object({
  title: z.string().min(1, 'Nome obrigatório').max(100),
});

export const createItemSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120),
  quantity: z.number().int().min(1).max(999).default(1),
  category: z.enum([
    'HORTIFRUTI', 'ACOUGUE', 'PADARIA',
    'LIMPEZA', 'HIGIENE', 'BEBIDAS', 'OUTROS',
  ]).default('OUTROS'),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  quantity: z.number().int().min(1).max(999).optional(),
  category: z.enum([
    'HORTIFRUTI', 'ACOUGUE', 'PADARIA',
    'LIMPEZA', 'HIGIENE', 'BEBIDAS', 'OUTROS',
  ]).optional(),
  checked: z.boolean().optional(),
});
```

**Critérios de aceite:**
- [ ] `signupSchema.parse({ email: 'a@b.com', password: 'Teste123' })` não lança
- [ ] `signupSchema.parse({ email: 'a@b.com', password: 'abc' })` lança com mensagem "ao menos 8 caracteres"
- [ ] `signupSchema.parse({ email: 'a@b.com', password: 'abcdefgh' })` lança com mensagem "ao menos um número"
- [ ] `updateItemSchema.parse({ checked: true })` não lança (todos campos opcionais)
- [ ] `createItemSchema.parse({ name: 'Arroz' })` retorna `{ name: 'Arroz', quantity: 1, category: 'OUTROS' }`

---

## FASE 2 — Autenticação

### TASK-009 — Configuração Auth.js

**Descrição:** Configurar Auth.js v5 com Credentials Provider conforme ADR-007.

**`src/lib/auth.ts`:**
```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/modules/shared/validators';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 dias
  cookies: {
    sessionToken: {
      options: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
```

**`src/app/api/auth/[...nextauth]/route.ts`:**
```ts
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

**`src/middleware.ts`:**
```ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith('/(auth)') ||
    ['/login', '/signup', '/forgot-password', '/reset-password'].includes(req.nextUrl.pathname);

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/lists', req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Critérios de aceite:**
- [ ] Rota `/api/auth/[...nextauth]` responde 200
- [ ] Usuário não autenticado em `/lists` é redirecionado para `/login`
- [ ] Usuário autenticado em `/login` é redirecionado para `/lists`
- [ ] Cookie `next-auth.session-token` é `httpOnly`
- [ ] JWT contém campo `id` do usuário

---

### TASK-010 — Use-case: Cadastro

**Descrição:** Lógica de negócio para criação de conta.

**`src/modules/auth/use-cases/signup.ts`:**
```ts
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/modules/shared/validators';
import { Errors } from '@/modules/shared/errors';
import { z } from 'zod';

type SignupInput = z.infer<typeof signupSchema>;

export async function signupUseCase(input: SignupInput) {
  const data = signupSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw Errors.CONFLICT(
      'EMAIL_ALREADY_EXISTS',
      'Este email já está cadastrado. Faça login ou recupere sua senha.',
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name ?? null,
    },
    select: { id: true, email: true, name: true },
  });

  return user;
}
```

**`src/app/api/v1/auth/signup/route.ts`:**
```ts
import { NextRequest } from 'next/server';
import { signupUseCase } from '@/modules/auth/use-cases/signup';
import { apiSuccess, apiError } from '@/modules/shared/http';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await signupUseCase(body);
    return apiSuccess(user, 201);
  } catch (error) {
    return apiError(error);
  }
}
```

**Critérios de aceite:**
- [ ] `POST /api/v1/auth/signup` com dados válidos retorna 201 com `{ id, email, name }`
- [ ] Email duplicado retorna 409 com `code: "EMAIL_ALREADY_EXISTS"`
- [ ] Senha inválida (< 8 chars) retorna 422
- [ ] `passwordHash` **nunca** aparece na resposta
- [ ] Hash gerado com bcrypt cost factor 12 (verificar via `bcrypt.getRounds(hash) === 12`)

---

### TASK-011 — Use-case: Login com rate limiting

**Descrição:** Autenticação com bloqueio por tentativas e rate limiting por IP.

**`src/lib/rate-limit.ts`:**
```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'rl:login',
});

export const mutationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'rl:mutation',
});

export const resetPasswordRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:reset',
});
```

**`src/modules/auth/use-cases/login.ts`:**
```ts
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginRateLimit } from '@/lib/rate-limit';
import { Errors } from '@/modules/shared/errors';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const GENERIC_ERROR_MSG = 'Email ou senha incorretos.';

export async function loginUseCase(email: string, password: string, ip: string) {
  // Rate limit por IP+email
  const key = `${ip}:${email}`;
  const { success } = await loginRateLimit.limit(key);
  if (!success) throw Errors.RATE_LIMITED();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error(GENERIC_ERROR_MSG); // Não vaza existência de email
  }

  // Conta bloqueada?
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw Errors.CONFLICT(
      'ACCOUNT_LOCKED',
      `Muitas tentativas. Tente novamente em 15 minutos.`,
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= MAX_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
      },
    });

    throw Errors.CONFLICT('INVALID_CREDENTIALS', GENERIC_ERROR_MSG);
  }

  // Reset contador após login bem-sucedido
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  return { id: user.id, email: user.email, name: user.name };
}
```

**Critérios de aceite:**
- [ ] Login com credenciais válidas retorna `{ id, email, name }` e reseta `failedLoginAttempts`
- [ ] Login com senha errada incrementa `failedLoginAttempts`
- [ ] 5 tentativas falhas em 15min bloqueia conta (`lockedUntil` setado)
- [ ] Mensagem de erro para email inexistente é idêntica à de senha errada (anti-enumeração)
- [ ] Rate limit retorna 429 com `Retry-After` header
- [ ] `POST /api/v1/auth/login` bem-sucedido cria a sessão (cookie setado)

---

### TASK-012 — Use-case: Recuperação de senha

**Descrição:** Fluxo completo de reset de senha com token JWT de uso único.

**`src/modules/auth/use-cases/forgot-password.ts`:**
```ts
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { resetPasswordRateLimit } from '@/lib/rate-limit';

export async function forgotPasswordUseCase(email: string) {
  // Rate limit por email (3/hora)
  const { success } = await resetPasswordRateLimit.limit(email);
  if (!success) return; // Falha silenciosa (resposta sempre genérica)

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Resposta genérica — não vaza existência de email

  // Gerar token de 32 bytes em base64url
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

  // Invalidar tokens anteriores do usuário
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail({ to: email, name: user.name ?? email, resetUrl });
}
```

**`src/modules/auth/use-cases/reset-password.ts`:**
```ts
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Errors } from '@/modules/shared/errors';

export async function resetPasswordUseCase(rawToken: string, newPassword: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw Errors.VALIDATION('Token inválido ou expirado.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
}
```

**`src/lib/email.ts`:**
```ts
import { Resend } from 'resend';
import { env } from './env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail({
  to, name, resetUrl,
}: { to: string; name: string; resetUrl: string }) {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: 'Redefinir sua senha — SmartList',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Redefinir senha</h2>
        <p>Olá, ${name}!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta SmartList.</p>
        <p>
          <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
            Redefinir senha
          </a>
        </p>
        <p style="color:#666;font-size:14px;">Este link expira em 30 minutos. Se você não solicitou isso, ignore este email.</p>
      </div>
    `,
  });
}
```

**Critérios de aceite:**
- [ ] `POST /api/v1/auth/forgot-password` sempre retorna 202 com mensagem genérica, mesmo para email inexistente
- [ ] Token armazenado no banco como SHA-256 hash (nunca em claro)
- [ ] Token expira em exatamente 30 minutos
- [ ] Token é invalidado após primeiro uso (`usedAt` setado)
- [ ] Segundo uso do mesmo token retorna 422 com "Token inválido ou expirado"
- [ ] Reset bem-sucedido zera `failedLoginAttempts` e `lockedUntil`

---

### TASK-013 — Use-case: Logout

**Descrição:** Invalidar sessão no servidor e limpar cookie.

**`src/app/api/v1/auth/logout/route.ts`:**
```ts
import { signOut } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  await signOut({ redirect: false });
  return new NextResponse(null, { status: 204 });
}
```

**Critérios de aceite:**
- [ ] `POST /api/v1/auth/logout` retorna 204
- [ ] Cookie de sessão é removido da resposta
- [ ] Request subsequente às rotas protegidas retorna 401

---

## FASE 3 — API: Listas

### TASK-014 — Helper de sessão (auth guard)

**Descrição:** Utilitário para extrair e validar sessão em Route Handlers.

**`src/modules/shared/session.ts`:**
```ts
import { auth } from '@/lib/auth';
import { Errors } from './errors';

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw Errors.UNAUTHORIZED();
  return session.user as { id: string; email: string; name?: string | null };
}
```

**Critérios de aceite:**
- [ ] `requireSession()` retorna o usuário se sessão válida
- [ ] `requireSession()` lança `AppError UNAUTHORIZED` se sem sessão
- [ ] Usado em todos os Route Handlers protegidos (verificar via grep)

---

### TASK-015 — GET e POST /api/v1/lists

**Descrição:** Listar e criar listas do usuário autenticado.

**`src/modules/shopping-list/repository.ts`:**
```ts
import { prisma } from '@/lib/prisma';

export const shoppingListRepo = {
  findAllByUser(userId: string) {
    return prisma.shoppingList.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { items: true } },
        items: { where: { checked: true }, select: { id: true } },
      },
    });
  },

  countByUser(userId: string) {
    return prisma.shoppingList.count({ where: { userId } });
  },

  create(userId: string, title: string) {
    return prisma.shoppingList.create({
      data: { userId, title },
    });
  },

  findByIdAndUser(id: string, userId: string) {
    return prisma.shoppingList.findFirst({ where: { id, userId } });
  },

  update(id: string, title: string) {
    return prisma.shoppingList.update({ where: { id }, data: { title } });
  },

  delete(id: string) {
    return prisma.shoppingList.delete({ where: { id } });
  },
};
```

**`src/app/api/v1/lists/route.ts`:**
```ts
import { NextRequest } from 'next/server';
import { requireSession } from '@/modules/shared/session';
import { shoppingListRepo } from '@/modules/shopping-list/repository';
import { createListSchema } from '@/modules/shared/validators';
import { Errors } from '@/modules/shared/errors';
import { apiSuccess, apiError } from '@/modules/shared/http';

const MAX_LISTS = 50;

export async function GET() {
  try {
    const user = await requireSession();
    const lists = await shoppingListRepo.findAllByUser(user.id);

    return apiSuccess(lists.map(list => ({
      id: list.id,
      title: list.title,
      totalItems: list._count.items,
      checkedItems: list.items.length,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    })));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = await req.json();
    const { title } = createListSchema.parse(body);

    const count = await shoppingListRepo.countByUser(user.id);
    if (count >= MAX_LISTS) throw Errors.LIST_LIMIT_REACHED();

    const list = await shoppingListRepo.create(user.id, title);
    return apiSuccess(list, 201);
  } catch (error) {
    return apiError(error);
  }
}
```

**Critérios de aceite:**
- [ ] `GET /api/v1/lists` sem sessão retorna 401
- [ ] `GET /api/v1/lists` retorna array com `{ id, title, totalItems, checkedItems, createdAt, updatedAt }`
- [ ] Usuário A não vê listas do Usuário B (verificar via teste de IDOR)
- [ ] `POST /api/v1/lists` com `title` vazio retorna 422
- [ ] `POST /api/v1/lists` com 50 listas existentes retorna 422 com `LIST_LIMIT_REACHED`
- [ ] `POST /api/v1/lists` bem-sucedido retorna 201

---

### TASK-016 — PATCH /api/v1/lists/:id

**Descrição:** Renomear uma lista.

**`src/app/api/v1/lists/[id]/route.ts` — handler PATCH:**
```ts
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireSession();
    const body = await req.json();
    const { title } = updateListSchema.parse(body);

    const list = await shoppingListRepo.findByIdAndUser(params.id, user.id);
    if (!list) throw Errors.NOT_FOUND('Lista');

    const updated = await shoppingListRepo.update(params.id, title);
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error);
  }
}
```

**Critérios de aceite:**
- [ ] 200 com lista atualizada se autorizado
- [ ] 401 sem sessão
- [ ] 403/404 se lista pertence a outro usuário (IDOR protegido)
- [ ] 422 se `title` vazio

---

### TASK-017 — DELETE /api/v1/lists/:id

**Descrição:** Excluir lista e todos os itens em cascata.

**Handler DELETE no mesmo arquivo `[id]/route.ts`:**
```ts
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireSession();

    const list = await shoppingListRepo.findByIdAndUser(params.id, user.id);
    if (!list) throw Errors.NOT_FOUND('Lista');

    await shoppingListRepo.delete(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
```

**Critérios de aceite:**
- [ ] 204 após exclusão
- [ ] Itens da lista são removidos em cascata (verificar no banco)
- [ ] 404 para lista inexistente ou de outro usuário

---

## FASE 4 — API: Itens

### TASK-018 — GET e POST /api/v1/lists/:id/items

**Descrição:** Listar e adicionar itens de uma lista.

**`src/modules/item/repository.ts`:**
```ts
import { prisma } from '@/lib/prisma';
import { Category } from '@prisma/client';

export const itemRepo = {
  findAllByList(listId: string) {
    return prisma.item.findMany({
      where: { listId },
      orderBy: [{ checked: 'asc' }, { createdAt: 'asc' }],
    });
  },

  countByList(listId: string) {
    return prisma.item.count({ where: { listId } });
  },

  create(listId: string, data: { name: string; quantity: number; category: Category }) {
    return prisma.item.create({ data: { listId, ...data } });
  },

  findByIdAndList(id: string, listId: string) {
    return prisma.item.findFirst({ where: { id, listId } });
  },

  findById(id: string) {
    return prisma.item.findUnique({ where: { id }, include: { list: true } });
  },

  update(id: string, data: Partial<{ name: string; quantity: number; category: Category; checked: boolean }>) {
    return prisma.item.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.item.delete({ where: { id } });
  },
};
```

**Critérios de aceite:**
- [ ] `GET /api/v1/lists/:id/items` retorna itens ordenados: não-comprados primeiro (`checked: false`), depois comprados (`checked: true`), ambos por `createdAt asc`
- [ ] `POST /api/v1/lists/:id/items` com 200 itens existentes retorna 422 com `ITEM_LIMIT_REACHED`
- [ ] Item criado sem `category` usa `OUTROS` como padrão
- [ ] Item criado sem `quantity` usa `1` como padrão
- [ ] Acesso à lista de outro usuário retorna 403/404

---

### TASK-019 — PATCH /api/v1/items/:id

**Descrição:** Endpoint unificado para editar nome, quantidade, categoria e estado comprado.

**`src/app/api/v1/items/[id]/route.ts`:**
```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/modules/shared/session';
import { itemRepo } from '@/modules/item/repository';
import { shoppingListRepo } from '@/modules/shopping-list/repository';
import { updateItemSchema } from '@/modules/shared/validators';
import { Errors } from '@/modules/shared/errors';
import { apiSuccess, apiError } from '@/modules/shared/http';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireSession();
    const body = await req.json();
    const data = updateItemSchema.parse(body);

    // Verificar propriedade via list.userId
    const item = await itemRepo.findById(params.id);
    if (!item || item.list.userId !== user.id) throw Errors.NOT_FOUND('Item');

    const updated = await itemRepo.update(params.id, data);
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireSession();

    const item = await itemRepo.findById(params.id);
    if (!item || item.list.userId !== user.id) throw Errors.NOT_FOUND('Item');

    await itemRepo.delete(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
```

**Critérios de aceite:**
- [ ] `PATCH /api/v1/items/:id` com `{ "checked": true }` atualiza apenas o campo `checked`
- [ ] `PATCH /api/v1/items/:id` com `{ "name": "Arroz", "quantity": 3 }` atualiza nome e quantidade
- [ ] Body vazio `{}` retorna 200 sem alterações (todos campos opcionais)
- [ ] Acesso a item de outro usuário retorna 404 (IDOR protegido)
- [ ] Mudança de `checked` é refletida na ordenação do `GET /items`

---

### TASK-020 — DELETE /api/v1/items/:id

Implementado junto ao TASK-019 no mesmo arquivo. Ver critérios acima.

**Critérios de aceite adicionais:**
- [ ] 204 após exclusão bem-sucedida
- [ ] Item não mais retornado no `GET /lists/:id/items` após exclusão

---

### TASK-021 — Rate limiting nas mutations

**Descrição:** Aplicar rate limit de 100 mutations/minuto por usuário em todas as rotas de escrita.

**Criar wrapper `src/modules/shared/with-rate-limit.ts`:**
```ts
import { mutationRateLimit } from '@/lib/rate-limit';
import { Errors } from './errors';
import { NextResponse } from 'next/server';

export async function checkMutationRateLimit(userId: string) {
  const { success, reset } = await mutationRateLimit.limit(userId);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    throw Object.assign(Errors.RATE_LIMITED(), { retryAfter });
  }
}
```

**Atualizar `apiError` para incluir `Retry-After` header quando `retryAfter` estiver presente.**

**Critérios de aceite:**
- [ ] Mais de 100 mutations/minuto de um usuário retorna 429
- [ ] Resposta 429 inclui header `Retry-After` com segundos até liberação
- [ ] Rate limit é por usuário (não global)
- [ ] GET endpoints não são contados no rate limit de mutations

---

## FASE 5 — Frontend: Auth

### TASK-022 — Layout de autenticação

**Descrição:** Layout compartilhado para telas de auth, centrado e com branding.

**`src/app/(auth)/layout.tsx`:**
- Container centralizado na tela (`min-h-screen flex items-center justify-center`)
- Card com logo/nome do app no topo
- Responsivo em 320px+

**Critérios de aceite:**
- [ ] Renderiza sem erros em 320px, 375px e 768px
- [ ] Logo/nome "SmartList" visível
- [ ] Sem scroll horizontal em qualquer breakpoint

---

### TASK-023 — Página de Cadastro (`/signup`)

**Descrição:** Formulário de criação de conta com validação inline.

**Campos:** Email, Senha, Nome (opcional)  
**Comportamento:**
- Validação com `react-hook-form` + `zodResolver(signupSchema)`
- Erro inline em cada campo (abaixo do input, em `text-sm text-destructive`)
- Botão "Criar conta" desabilitado enquanto formulário inválido ou loading
- Após cadastro bem-sucedido: login automático via `signIn()` + redirect para `/lists`
- Link "Já tem conta? Faça login" → `/login`

**Contrato de chamada da API:**
```ts
POST /api/v1/auth/signup
Body: { email: string, password: string, name?: string }
Success (201): { id, email, name }
Error (409): { error: { code: "EMAIL_ALREADY_EXISTS", message: string } }
Error (422): { error: { code: "VALIDATION_ERROR", message: string } }
```

**Critérios de aceite (CS-08):**
- [ ] Todos os campos têm `<label>` associado (`htmlFor` + `id`)
- [ ] Erro de email duplicado exibe mensagem amigável (não "409 Conflict")
- [ ] Botão desabilitado com formulário vazio
- [ ] Foco automático no campo Email ao abrir a página
- [ ] Fluxo completo executável em ≤ 60 segundos (CS-08)
- [ ] Alvo tocável do botão ≥ 44×44px

---

### TASK-024 — Página de Login (`/login`)

**Descrição:** Formulário de autenticação.

**Campos:** Email, Senha  
**Comportamento:**
- Validação inline
- Erro genérico "Email ou senha incorretos" (sem revelar qual campo errou)
- Conta bloqueada exibe "Muitas tentativas. Tente novamente em 15 minutos."
- Sessão expirada (redirect com `?error=session_expired`) exibe toast informativo
- Links: "Esqueci minha senha" → `/forgot-password` | "Criar conta" → `/signup`

**Critérios de aceite (CS-06, CS-07):**
- [ ] Login bem-sucedido redireciona para `/lists`
- [ ] Cookie de sessão persiste por 30 dias (CS-06: sem logout ao fechar/reabrir em 24h)
- [ ] Erro de credenciais não trava a tela — input continua editável (CS-07)
- [ ] Mensagem de erro é genérica (não "senha incorreta" ou "email não encontrado")

---

### TASK-025 — Página de Recuperação de Senha (`/forgot-password`)

**Descrição:** Formulário para solicitar reset de senha.

**Campo:** Email  
**Comportamento:**
- Submit sempre exibe toast: "Se o email existir, enviamos as instruções."
- Loading state no botão durante request

**Critérios de aceite:**
- [ ] Toast genérico exibido independente de o email existir ou não
- [ ] Email inválido (sem `@`) mostra erro inline antes de submeter
- [ ] Link "Voltar ao login" presente

---

### TASK-026 — Página de Redefinição de Senha (`/reset-password`)

**Descrição:** Formulário para definir nova senha com token da URL.

**Parâmetro:** `?token=...`  
**Campos:** Nova senha, Confirmar senha  
**Comportamento:**
- Token ausente na URL → redirect para `/forgot-password`
- Token expirado/inválido → exibe erro e link para solicitar novo
- Sucesso → redirect para `/login` com toast "Senha redefinida. Faça login."

**Critérios de aceite:**
- [ ] Senhas diferentes exibem erro inline "Senhas não coincidem"
- [ ] Token inválido exibe mensagem clara
- [ ] Após reset, token não pode ser reutilizado (exibe erro no reuso)

---

## FASE 6 — Frontend: Listas

### TASK-027 — Layout da aplicação autenticada

**Descrição:** Shell com header, área de conteúdo e navegação.

**Estrutura:**
- Header: logo "SmartList" + botão de logout
- Área principal com `max-w-2xl mx-auto px-4`
- FAB (Floating Action Button) no canto inferior direito para criar lista

**Critérios de aceite:**
- [ ] Logout chama `POST /api/v1/auth/logout` e redireciona para `/login`
- [ ] FAB visível e acessível em 375px (thumb zone)
- [ ] FAB tem aria-label descritivo
- [ ] Sem scroll horizontal em 320px

---

### TASK-028 — Tela de Listas (`/lists`)

**Descrição:** Listagem de todas as listas do usuário com progresso.

**Componente `ListCard`:**
```tsx
interface ListCardProps {
  id: string;
  title: string;
  totalItems: number;
  checkedItems: number;
  updatedAt: Date;
}
```

**Estado vazio:** ilustração + "Nenhuma lista ainda. Crie sua primeira lista!" + botão

**Menu de ações (⋮):** shadcn `DropdownMenu` com opções "Renomear" e "Excluir"

**Critérios de aceite:**
- [ ] Barra de progresso (`Progress` do shadcn) exibe `(checkedItems / totalItems) * 100`
- [ ] Lista com 0 itens: progresso = 0%, exibe "0 itens"
- [ ] Lista 100% completa: barra verde/primary filled
- [ ] Cards ordenados por `updatedAt` decrescente
- [ ] Estado vazio renderiza CTA clicável
- [ ] Limite de 50 listas: FAB desabilitado com tooltip explicativo

---

### TASK-029 — Modal de Criar/Editar Lista

**Descrição:** shadcn `Dialog` para criação e edição de lista.

**Comportamento:**
- Foco automático no input ao abrir
- Confirmar com Enter ou botão "Criar"/"Salvar"
- Botão desabilitado se input vazio
- Optimistic update: card aparece/atualiza antes da resposta do servidor

**Contrato de integração:**
```ts
// Criar
POST /api/v1/lists
Body: { title: string }

// Editar
PATCH /api/v1/lists/:id
Body: { title: string }
```

**Critérios de aceite (CS-01):**
- [ ] Criar lista com nome em ≤ 3 toques (CS-01): abrir FAB → digitar → Enter
- [ ] Card aparece na lista em < 300ms (optimistic update)
- [ ] Erro da API reverte o optimistic update e exibe toast

---

### TASK-030 — Confirmação de Exclusão de Lista

**Descrição:** shadcn `AlertDialog` com confirmação explícita antes de excluir.

**Texto:** "Excluir '[título da lista]'? Esta ação não pode ser desfeita."  
**Botões:** "Cancelar" e "Excluir" (`variant="destructive"`)

**Critérios de aceite:**
- [ ] Lista não é excluída ao clicar acidentalmente fora do dialog
- [ ] Após confirmação, card desaparece e itens são removidos em cascata
- [ ] Toast de confirmação após exclusão bem-sucedida

---

## FASE 7 — Frontend: Itens

### TASK-031 — Tela de Itens (`/lists/[id]`)

**Descrição:** Tela principal de uso do app — visualização e gerenciamento de itens.

**Layout:**
- Header com título da lista e botão voltar (←)
- Barra de progresso geral no topo
- Campo de input fixo abaixo do header
- Lista de itens rolável
- Agrupamento: "Pendentes" → itens com `checked: false` | "Comprados (N)" → itens com `checked: true`

**Critérios de aceite:**
- [ ] Lista vazia: input com foco automático e teclado aberto (ADR-006)
- [ ] Lista com itens: input visível mas sem foco automático
- [ ] Progresso exibe `X de Y itens` e barra visual
- [ ] Divider "Comprados (N)" aparece somente quando há itens comprados
- [ ] Tela carrega em < 2s em 4G (CS-04)

---

### TASK-032 — Adicionar Item (fluxo rápido)

**Descrição:** Input principal de adição de item. RF mais crítico do produto.

**Comportamento:**
- Campo visível e fixo no topo da lista de itens
- Enter adiciona item, limpa campo, mantém foco
- Botão "+" com mesmo comportamento do Enter
- Optimistic update: item aparece em < 300ms
- Categoria padrão `OUTROS`; quantidade padrão `1`

**Contrato:**
```ts
POST /api/v1/lists/:id/items
Body: { name: string, quantity?: number, category?: string }
```

**Critérios de aceite (CS-02, CS-03):**
- [ ] Adicionar 5 itens em ≤ 60 segundos no primeiro uso (CS-02)
- [ ] Item aparece em < 300ms (optimistic update — CS-03)
- [ ] Campo limpo e foco mantido após cada adição
- [ ] Enter-Enter-Enter adiciona 3 itens sequencialmente
- [ ] Limite de 200 itens: input desabilitado com toast "Lista cheia (200 itens)."

---

### TASK-033 — Marcar/Desmarcar Item

**Descrição:** Toggle de estado comprado via toque no checkbox ou no card.

**Comportamento:**
- Área clicável: card inteiro (não apenas o checkbox) — alvo mínimo 44×44px
- Visual pendente: texto normal, checkbox vazio
- Visual comprado: texto riscado, cor `muted-foreground`, checkbox marcado
- Item se move para o grupo "Comprados" com animação de transição
- Optimistic update imediato

**Critérios de aceite (CS-03):**
- [ ] Mudança de estado em < 300ms com animação (CS-03)
- [ ] Checkbox marcado tem `aria-checked="true"`
- [ ] Reverter (desmarcar) move item de volta para "Pendentes"
- [ ] Progresso na tela e no card da lista atualiza em tempo real

---

### TASK-034 — Editar Item

**Descrição:** shadcn `Drawer` (bottom sheet) para edição de campos do item.

**Acesso:** Long-press (500ms) no item ou ícone de lápis revelado no swipe direito

**Campos no Drawer:** Nome, Quantidade (input numérico 1–999), Categoria (Select com 7 opções)

**Critérios de aceite:**
- [ ] Drawer abre com campos pré-preenchidos
- [ ] Select de categoria exibe exatamente 7 opções com ícone e label
- [ ] Salvar fecha o drawer e reflete alteração sem reload
- [ ] Cancelar descarta alterações

---

### TASK-035 — Excluir Item com Undo

**Descrição:** Swipe-to-delete com undo toast de 5 segundos.

**Comportamento:**
- Swipe para esquerda no item revela botão vermelho "Excluir"
- Exclusão sem confirmação (reversível)
- Toast (shadcn `Sonner`): "Item removido. [Desfazer]" por 5 segundos
- "Desfazer" restaura o item na posição original
- Após 5 segundos, exclusão é permanente

**Critérios de aceite:**
- [ ] Item desaparece visualmente em < 300ms após swipe
- [ ] Toast aparece com botão "Desfazer" clicável
- [ ] Desfazer dentro de 5s: item restaurado, API DELETE nunca chamada (ou PUT de restauração)
- [ ] Após 5s: `DELETE /api/v1/items/:id` chamado, item removido do banco

---

### TASK-036 — Resiliência de rede (RNF006)

**Descrição:** Configurar TanStack Query para retry automático e feedback de rede.

**`src/lib/query-client.ts`:**
```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // backoff exponencial
    },
    mutations: {
      retry: 0, // Mutations não fazem retry automático
    },
  },
});
```

**Componente `NetworkStatus`:** toast "Sem conexão. Tentando novamente..." quando offline; "Conexão restaurada" ao reconectar.

**Critérios de aceite:**
- [ ] Falha de request exibe toast com mensagem amigável
- [ ] TanStack Query tenta 3 vezes com backoff exponencial (1s, 2s, 4s)
- [ ] Dados do cache continuam visíveis durante falha (read-only mode)
- [ ] Ao reconectar, toast "Conexão restaurada" aparece e dados são sincronizados

---

## FASE 8 — Testes & QA

### TASK-037 — Testes unitários (Vitest)

**Meta:** ≥ 80% das funções de negócio cobertas.

**Casos obrigatórios:**

| Arquivo | Cenários |
|---------|----------|
| `signup.test.ts` | Email duplicado → 409; senha sem número → 422; cadastro válido → user sem passwordHash |
| `login.test.ts` | Credenciais inválidas → mensagem genérica; 5 tentativas → conta bloqueada; login válido → reseta contador |
| `forgot-password.test.ts` | Email inexistente → sem erro (genérico); token salvo como hash SHA-256; rate limit 3/hora |
| `reset-password.test.ts` | Token expirado → 422; token usado → 422; token válido → senha atualizada; failedLoginAttempts zerado |
| `validators.test.ts` | Todos os schemas Zod validados com casos happy + unhappy |
| `categories.test.ts` | CATEGORIES tem exatamente 7 entradas |

**Critérios de aceite:**
- [ ] `npm test` passa 100%
- [ ] Cobertura ≥ 80% em `src/modules/`
- [ ] Nenhum teste depende de banco real (usar mocks do Prisma)

---

### TASK-038 — Testes de integração (Vitest + testcontainers)

**Meta:** Todos os endpoints da API cobertos com banco real.

**Casos obrigatórios (PRD seção 11):**

| Endpoint | Cenários |
|----------|----------|
| `POST /signup` | Email duplicado → 409; senha < 8 → 422; válido → 201 |
| `POST /login` | Inválido → 401 genérico; 5 falhas → bloqueio 15min; válido → 200 + cookie |
| `POST /forgot-password` | Sempre 202; token no banco como hash |
| `POST /reset-password` | Token expirado → 422; usado → 422; válido → 200 |
| `GET /lists` | Sem auth → 401; lista correta do usuário (IDOR: user A não vê listas de B) |
| `POST /lists` | 50 listas → 422 `LIST_LIMIT_REACHED`; válido → 201 |
| `DELETE /lists/:id` | Cascade: itens removidos |
| `POST /lists/:id/items` | 200 itens → 422 `ITEM_LIMIT_REACHED` |
| `PATCH /items/:id` | IDOR: user A não altera item de B; `checked` toggle funciona |
| `DELETE /items/:id` | 204; item removido |

**Critérios de aceite:**
- [ ] Testes usam banco PostgreSQL real via testcontainers (sem mocks de DB)
- [ ] Cada teste limpa o banco (truncate ou transaction rollback)
- [ ] 100% dos endpoints cobertos com ao menos 1 caso happy e 1 unhappy

---

### TASK-039 — Testes E2E Playwright (mobile 375px)

**Fluxos obrigatórios:**

| Fluxo | Passos |
|-------|--------|
| Cadastro | Abrir `/signup` → preencher dados → "Criar conta" → ver tela `/lists` |
| Criar lista | FAB → modal → digitar nome → Enter → card na lista |
| Adicionar itens | Abrir lista → digitar "Arroz" → Enter → digitar "Feijão" → Enter → 2 itens visíveis |
| Marcar comprado | Tocar em "Arroz" → item vai para "Comprados" → progresso 50% |
| Undo exclusão | Swipe em item → botão excluir → tocar "Desfazer" → item restaurado |
| Login bloqueado | 5 tentativas incorretas → mensagem de bloqueio |

**Configuração viewport:** `{ width: 375, height: 812 }` (iPhone X)

**Critérios de aceite:**
- [ ] Todos os 6 fluxos passam em CI
- [ ] Viewport forçado para 375px em todos os testes
- [ ] Screenshots de falhas capturados automaticamente

---

### TASK-040 — Checklist de acessibilidade

**Meta:** Lighthouse Accessibility ≥ 90 (RNF008).

**Verificações manuais:**

| Item | Critério |
|------|---------|
| Labels | Todos os inputs têm `<label>` associado |
| Alvos de toque | Mínimo 44×44px em todos os elementos interativos |
| Contraste | Texto principal ≥ 4.5:1, texto grande ≥ 3:1 |
| Foco | Tab order lógico, foco visível em todos os interativos |
| Aria | Checkboxes têm `aria-checked`, botões têm labels descritivos |
| VoiceOver | Fluxo principal navegável sem gestos de toque |

**Critérios de aceite:**
- [ ] `npx lighthouse /lists --output=json` reporta Accessibility ≥ 90
- [ ] Zero erros no axe-core (integrado ao Playwright)
- [ ] VoiceOver/TalkBack: criar lista e adicionar item completos sem ver a tela

---

### TASK-041 — Checklist de performance

**Meta:** LCP < 2.5s em 4G, TBT < 200ms (RNF003).

**Verificações:**

| Métrica | Meta | Ferramenta |
|---------|------|-----------|
| LCP | < 2.5s | Lighthouse |
| TBT | < 200ms | Lighthouse |
| Interações | < 300ms | DevTools Performance |
| Bundle size | Verificar bundle analyzer | `npm run analyze` |

**Critérios de aceite:**
- [ ] Lighthouse Performance ≥ 85 em mobile (4G simulado)
- [ ] Nenhuma interação bloqueante > 300ms
- [ ] Sem imports desnecessários no bundle principal

---

### TASK-042 — Testes de segurança manuais

**Checklist obrigatório:**

| Teste | Critério de aceite |
|-------|-------------------|
| IDOR — listas | User A não acessa/modifica lista de User B via `PATCH /lists/[id-de-B]` |
| IDOR — itens | User A não acessa/modifica item de User B via `PATCH /items/[id-de-B]` |
| Senha em texto | Banco de dados: campo `passwordHash` começa com `$2b$12$` (bcrypt) |
| Cookie seguro | Cookie `httpOnly: true`, `sameSite: lax` verificado via DevTools |
| Token reset | Banco armazena SHA-256 hash, nunca o token em claro |
| Mensagem genérica | Login com email inexistente = mesma mensagem de senha errada |
| Enumeração reset | `forgot-password` com email inexistente = mesma resposta |

---

## FASE 9 — CI/CD & Deploy

### TASK-043 — GitHub Actions (CI pipeline)

**`.github/workflows/ci.yml`:**

```yaml
name: CI
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint         # Zero warnings
      - run: npm run typecheck    # tsc --noEmit
      - run: npm test             # Vitest unitários
      - run: npm run test:int     # Integração (com testcontainers)
      - run: npm run build        # next build sem erros
```

**Critérios de aceite:**
- [ ] Pipeline falha se lint tiver warnings
- [ ] Pipeline falha se TypeScript tiver erros
- [ ] Pipeline falha se qualquer teste unitário ou de integração falhar
- [ ] Pipeline falha se `next build` falhar
- [ ] PR sem pipeline verde não pode fazer merge (branch protection)

---

### TASK-044 — Deploy na Vercel

**Configuração:**

| Item | Valor |
|------|-------|
| Framework | Next.js (auto-detectado) |
| Build command | `npm run build` |
| Output directory | `.next` |
| Env vars | Todas as 8 vars do TASK-004 configuradas no painel |
| Preview deploys | Automático em cada PR |
| Production deploy | Automático ao merge na `main` |

**`vercel.json`:**
```json
{
  "framework": "nextjs",
  "regions": ["gru1"]
}
```

**Critérios de aceite (CS-04):**
- [ ] Deploy de produção bem-sucedido
- [ ] `NEXT_PUBLIC_APP_URL` apontando para o domínio de produção
- [ ] Primeira tela carrega em < 2s em 4G, < 4s em 3G (CS-04)
- [ ] HTTPS habilitado (obrigatório para cookies `Secure`)

---

### TASK-045 — Smoke test pós-deploy

**Checklist de validação após cada deploy de produção:**

| Critério de Sucesso | Verificação |
|---------------------|-------------|
| CS-01 | Criar lista em ≤ 3 toques no celular real |
| CS-02 | Adicionar 5 itens em ≤ 60 segundos |
| CS-03 | Marcar item: mudança de estado em < 300ms |
| CS-04 | LCP < 2s (Chrome DevTools → Network: Fast 4G) |
| CS-05 | Fluxo completo com uma mão, sem zoom, em 375px |
| CS-06 | Fechar e reabrir app após 1h: sessão mantida |
| CS-07 | Login incorreto: tela não trava, input editável |
| CS-08 | Cadastro novo: conta criada e logada em ≤ 60s |

---

## Contrato de API Completo

Referência rápida de todos os endpoints para integração frontend ↔ backend.

| Método | Rota | Auth | Body | Sucesso | Erros |
|--------|------|------|------|---------|-------|
| POST | `/api/v1/auth/signup` | ✗ | `{email, password, name?}` | 201 `{id,email,name}` | 409, 422 |
| POST | `/api/v1/auth/login` | ✗ | `{email, password}` | 200 + cookie | 401, 429 |
| POST | `/api/v1/auth/logout` | ✓ | — | 204 | 401 |
| POST | `/api/v1/auth/forgot-password` | ✗ | `{email}` | 202 (sempre) | 422 |
| POST | `/api/v1/auth/reset-password` | ✗ | `{token, password, confirmPassword}` | 200 | 400, 422 |
| GET | `/api/v1/lists` | ✓ | — | 200 `List[]` | 401 |
| POST | `/api/v1/lists` | ✓ | `{title}` | 201 `List` | 401, 422, 429 |
| PATCH | `/api/v1/lists/:id` | ✓ | `{title}` | 200 `List` | 401, 403, 404, 422 |
| DELETE | `/api/v1/lists/:id` | ✓ | — | 204 | 401, 403, 404 |
| GET | `/api/v1/lists/:id/items` | ✓ | — | 200 `Item[]` | 401, 403, 404 |
| POST | `/api/v1/lists/:id/items` | ✓ | `{name, quantity?, category?}` | 201 `Item` | 401, 403, 422, 429 |
| PATCH | `/api/v1/items/:id` | ✓ | `{name?, quantity?, category?, checked?}` | 200 `Item` | 401, 403, 404, 422 |
| DELETE | `/api/v1/items/:id` | ✓ | — | 204 | 401, 403, 404 |

### Formato padrão de erro

```json
{
  "error": {
    "code": "CÓDIGO_EM_SNAKE_CASE",
    "message": "Mensagem amigável em PT-BR"
  }
}
```

### Códigos de erro usados

| Code | HTTP | Quando |
|------|------|--------|
| `UNAUTHORIZED` | 401 | Sem sessão ativa |
| `FORBIDDEN` | 403 | Recurso de outro usuário |
| `LIST_NOT_FOUND` | 404 | Lista não existe ou não pertence ao usuário |
| `ITEM_NOT_FOUND` | 404 | Item não existe ou não pertence ao usuário |
| `EMAIL_ALREADY_EXISTS` | 409 | Signup com email já cadastrado |
| `ACCOUNT_LOCKED` | 409 | Conta bloqueada por excesso de tentativas |
| `INVALID_CREDENTIALS` | 409 | Credenciais inválidas no login |
| `VALIDATION_ERROR` | 422 | Dados de entrada inválidos |
| `LIST_LIMIT_REACHED` | 422 | Usuário já tem 50 listas |
| `ITEM_LIMIT_REACHED` | 422 | Lista já tem 200 itens |
| `RATE_LIMITED` | 429 | Rate limit excedido |

---

## Rastreabilidade PRD ↔ Tasks

| Requisito PRD | Task(s) |
|---------------|---------|
| RF000 — Cadastro | TASK-010, TASK-023 |
| RF000.1 — Recuperação de senha | TASK-012, TASK-025, TASK-026 |
| RF001 — Login | TASK-011, TASK-024 |
| RF002 — Criar Lista | TASK-015, TASK-029 |
| RF003 — Visualizar Listas | TASK-015, TASK-028 |
| RF004 — Editar Lista | TASK-016, TASK-029 |
| RF005 — Excluir Lista | TASK-017, TASK-030 |
| RF006 — Adicionar Item | TASK-018, TASK-032 |
| RF007 — Editar Item | TASK-019, TASK-034 |
| RF008 — Excluir Item | TASK-020, TASK-035 |
| RF009 — Marcar/Desmarcar | TASK-019, TASK-033 |
| RF010 — Categorias | TASK-003, TASK-008, TASK-034 |
| RNF001/002 — Mobile First | TASK-022 → 036, TASK-040 |
| RNF003 — Performance | TASK-041, TASK-044 |
| RNF004/005 — Segurança | TASK-009, TASK-011, TASK-042 |
| RNF006 — Resiliência | TASK-036 |
| RNF008 — Acessibilidade | TASK-040 |
| RNF010 — Rate limiting | TASK-011, TASK-021 |
| CS-01 a CS-08 | TASK-045 |
| ADR-001 a ADR-007 | TASK-001, TASK-006, TASK-009 |

---

*SmartList SPEC v1.0 — gerado a partir do PRD v1.2*
