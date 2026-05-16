# SmartList — Product Requirements Document

**Versão:** 1.2
**Status:** Pronto para desenvolvimento
**Revisão:** Sênior aplicada (v1.2 incorpora decisões de stack e simplificações de escopo)
**Sistema:** Inteligente de Lista de Mercado

---

## Changelog v1.1 → v1.2

| Mudança | Decisão |
| --- | --- |
| Autenticação | Google OAuth **substituído** por autenticação própria (email + senha) |
| LGPD / Política de Privacidade | **Removido do escopo** do MVP |
| Dark Mode | **Não será implementado** no MVP |
| Offline parcial (RNF006) | **Removido**. Substituído por "Resiliência de rede" |
| Design System | Confirmado **Tailwind + shadcn/ui** (sem adoção de HIG) |
| Endpoint `PATCH /items/:id/check` | **Consolidado** em `PATCH /items/:id` |
| Conflito teclado × swipe (RF006/RF008) | **Resolvido**: foco automático apenas em lista vazia |
| Rate limiting | **Adicionado** como RNF010 |
| Alvo de toque mínimo | **Adicionado** ao RNF002 (44×44px) |
| Escala tipográfica e cores | **Adicionada** seção 10.1 com tokens Tailwind |
| Reordenação manual (campo `order`) | **Mantido** no schema, **sem endpoint** no MVP — documentado em ADR-005 |
| Cadastro de usuário | **Adicionado** RF000 (Cadastro) |
| Recuperação de senha | **Adicionado** RF000.1 (Recuperação de senha) |

---

## 1. Visão Geral

### Objetivo

Desenvolver um sistema web responsivo, otimizado para dispositivos móveis, que permita ao usuário criar, organizar e gerenciar listas de mercado de forma rápida, intuitiva e eficiente diretamente pelo navegador.

### Problema

Usuários recorrem a papel, bloco de notas, WhatsApp ou aplicativos complexos demais. Essas soluções resultam em:

- listas desorganizadas e itens esquecidos;
- falta de praticidade no ponto de venda;
- ausência de histórico e progresso de compra;
- excesso de passos para adicionar itens.

### Proposta de valor central

> "Criar e utilizar listas de mercado no celular de forma extremamente rápida e simples."

---

## 2. Critérios de Sucesso do MVP

O MVP será validado quando todos os critérios abaixo forem verificáveis de forma binária (passou / não passou):

| ID | Critério | Métrica mensurável |
| --- | --- | --- |
| CS-01 | Criação de lista é rápida | Usuário cria lista com nome em ≤ 3 toques |
| CS-02 | Adição de item é fluida | Usuário adiciona 5 itens em ≤ 60 segundos no primeiro uso |
| CS-03 | Marcação de item funciona | Toque no item altera estado em < 300ms com feedback visual |
| CS-04 | Carregamento aceitável | Primeira tela renderiza em < 2s em 4G e < 4s em 3G (a partir da 2ª navegação; cold start aceitável até 3s) |
| CS-05 | Usabilidade mobile | Fluxo completo executável com uma mão sem zoom |
| CS-06 | Sessão persistente | Usuário não é deslogado ao fechar e reabrir o app em 24h |
| CS-07 | Auth sem bloqueio | Erro de login exibe mensagem amigável sem travar a tela |
| CS-08 | Cadastro funcional | Usuário novo cria conta e faz primeiro login em ≤ 60 segundos |

---

## 3. Escopo do MVP

### Incluído

- **Autenticação própria** (cadastro + login com email e senha)
- **Recuperação de senha** via token por email
- CRUD completo de listas
- CRUD completo de itens (nome, quantidade, categoria)
- Marcar / desmarcar itens como comprados
- Categorias fixas predefinidas
- Progresso visual por lista
- Interface mobile first — responsiva em todos os dispositivos

### Fora do MVP — não implementar

| Escopo excluído deliberadamente |
| --- |
| Login social (Google, Apple, etc.) |
| Compartilhamento de listas entre usuários |
| Sincronização em tempo real (WebSocket / realtime) |
| PWA / instalação em home screen |
| Notificações push |
| OCR, IA, sugestões automáticas |
| Histórico de preços |
| Integração com mercados |
| Microserviços / arquitetura distribuída |
| Dark Mode |
| Offline mode / persistência local |
| Internacionalização (i18n) — app é PT-BR único |
| Política de privacidade / fluxos de LGPD |
| Reordenação manual de itens (drag-and-drop) |

---

## 4. Limites do Sistema

Limites aplicados ao MVP para dimensionamento correto de banco e queries:

| Recurso | Limite | Comportamento ao atingir |
| --- | --- | --- |
| Listas por usuário | 50 | Exibe mensagem: *"Limite de listas atingido. Exclua uma para criar nova."* |
| Itens por lista | 200 | Bloqueia adição com toast: *"Lista cheia (200 itens)."* |
| Caracteres no nome da lista | 100 | Campo bloqueia digitação após 100 caracteres |
| Caracteres no nome do item | 120 | Campo bloqueia digitação após 120 caracteres |
| Quantidade máxima de item | 999 | Campo numérico limita a 3 dígitos |
| Tamanho da senha | 8 a 64 caracteres | Validação inline no campo |
| Tentativas de login | 5 falhas em 15min | Bloqueia conta por 15min com mensagem clara |

---

## 5. Requisitos Funcionais

### RF000 — Cadastro de Usuário

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário cria conta no sistema usando email e senha. |
| **Campos** | Email (obrigatório, formato válido), Senha (8–64 chars, mínimo 1 letra e 1 número), Nome de exibição (opcional, máx. 60 chars). |
| **Comportamento** | Formulário em tela dedicada `/signup`. Validação inline em cada campo. Botão "Criar conta" desabilitado até todos os campos válidos. |
| **Hash de senha** | bcrypt com cost factor 12. **Nunca** armazenar senha em texto plano. |
| **Email duplicado** | Retorna erro: *"Este email já está cadastrado. Faça login ou recupere sua senha."* |
| **Pós-cadastro** | Login automático + redirect para tela de listas. Sem confirmação de email no MVP. |
| **Critério de aceite** | CS-08 |

### RF000.1 — Recuperação de Senha

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário que esqueceu a senha solicita um link de redefinição. |
| **Fluxo** | Tela `/forgot-password` → usuário informa email → sistema envia email com token JWT (válido por 30 minutos) → link leva para `/reset-password?token=...` → usuário define nova senha. |
| **Segurança** | Token de uso único, invalidado após reset bem-sucedido. Resposta da request é sempre genérica (*"Se o email existir, enviamos as instruções"*) para evitar enumeração de emails. |
| **Email transacional** | Enviado via Resend ou SMTP simples (a definir na implementação). Template HTML responsivo, em PT-BR. |
| **Critério de aceite** | Usuário consegue redefinir senha e logar com a nova credencial. Token expira corretamente após 30min. |

### RF001 — Autenticação (Login)

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário acessa o sistema via email e senha cadastrados. |
| **Fluxo feliz** | Usuário preenche email + senha → clica "Entrar" → sessão criada → redirecionado para lista de listas. |
| **Fluxo de erro — credenciais inválidas** | Toast/inline: *"Email ou senha incorretos."* Mensagem genérica deliberada (não revelar se email existe). |
| **Fluxo de erro — conta bloqueada** | Após 5 tentativas em 15min: *"Muitas tentativas. Tente novamente em 15 minutos."* |
| **Fluxo de erro — sessão expirada** | Redirect para `/login` com mensagem: *"Sua sessão expirou. Faça login novamente."* |
| **Sessão** | Cookie httpOnly + SameSite=Lax + Secure. JWT com expiração de 30 dias. Logout limpa o cookie e invalida o token no servidor (denylist em Redis ou tabela). |
| **Critério de aceite** | CS-06, CS-07 |

### RF002 — Criar Lista

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário cria uma nova lista de compras. |
| **Campo** | Nome da lista (obrigatório, 1–100 caracteres). |
| **Comportamento** | Modal (shadcn `Dialog`) ou bottom sheet (shadcn `Drawer`) com input. Foco automático no campo ao abrir. Confirmar com teclado (Enter) ou botão "Criar". |
| **Validação** | Nome em branco: exibe *"Nome obrigatório"* inline. Duplicata permitida. |
| **Critério de aceite** | CS-01 |

### RF003 — Visualizar Listas

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário vê todas as suas listas cadastradas. |
| **Exibição por card** | Nome da lista • Quantidade total de itens • Barra de progresso (itens marcados / total) • Data de criação |
| **Estado vazio** | Mensagem: *"Nenhuma lista ainda. Crie sua primeira lista!"* com botão de ação. |
| **Ordenação** | Listas ordenadas por data de atualização decrescente (mais recente primeiro). |
| **Critério de aceite** | Todas as listas do usuário logado são exibidas corretamente após reload. |

### RF004 — Editar Lista

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário altera o nome de uma lista existente. |
| **Acesso** | Botão de menu (⋮) em cada card de lista → opção "Renomear". |
| **Comportamento** | Mesmo modal do RF002 com campo pré-preenchido. |
| **Critério de aceite** | Alteração salva e refletida imediatamente no card sem reload. |

### RF005 — Excluir Lista

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário remove uma lista e todos os seus itens. |
| **Acesso** | Botão de menu (⋮) → opção "Excluir". |
| **Confirmação** | shadcn `AlertDialog`: *"Excluir '[nome da lista]'? Esta ação não pode ser desfeita."* Botões: "Cancelar" e "Excluir" (variant=`destructive`). |
| **Cascata** | Exclusão em cascata de todos os itens da lista no banco. |
| **Critério de aceite** | Lista e itens removidos do banco. Card desaparece da tela após confirmação. |

### RF006 — Adicionar Item (fluxo rápido)

> **RF mais crítico do produto.**

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário adiciona itens à lista com o mínimo de fricção possível. |
| **Campo principal** | Nome do item (obrigatório). Quantidade (padrão: 1). Categoria (opcional, dropdown). |
| **Comportamento de UX** | Campo de input visível no topo da tela. **Foco automático apenas quando a lista está vazia** (evita teclado cobrir itens em listas já populadas — ver decisão em ADR-006). Em listas com itens, foco ocorre apenas no toque do usuário. |
| **Inserção rápida** | Pressionar Enter ou botão "+" adiciona o item e limpa o campo mantendo o foco. Sequência Enter-Enter-Enter adiciona múltiplos itens sem interação extra. |
| **Adição em lote** | Após primeiro Enter em uma lista vazia, o foco permanece e o teclado fica aberto até o usuário sair do input. |
| **Feedback** | Item aparece na lista abaixo em < 300ms após confirmação (optimistic update). |
| **Critério de aceite** | CS-02, CS-03 |

### RF007 — Editar Item

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário edita nome, quantidade ou categoria de um item existente. |
| **Acesso** | Toque longo no item (long-press 500ms) ou ícone de edição (lápis) revelado no swipe para a direita. |
| **Comportamento** | shadcn `Drawer` (bottom sheet) com campos pré-preenchidos. Salvar fecha o drawer e atualiza o item na lista. |
| **Critério de aceite** | Alterações refletidas imediatamente sem reload. |

### RF008 — Excluir Item

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário remove um item da lista. |
| **Acesso** | Swipe para a esquerda no item revela botão vermelho de exclusão. |
| **Confirmação** | Não requer confirmação (ação reversível via undo toast por 5 segundos). |
| **Undo** | Toast (shadcn `Sonner`): *"Item removido. [Desfazer]"* aparece por 5s. Clicar em Desfazer restaura o item. |
| **Critério de aceite** | Item removido visualmente em < 300ms. Undo funciona dentro da janela de 5s. |

### RF009 — Marcar / Desmarcar Item como Comprado

| Item | Descrição |
| --- | --- |
| **Descrição** | Usuário indica que um item já foi colocado no carrinho. |
| **Interação** | Toque no checkbox ou no card do item alterna o estado. |
| **Visual — pendente** | Texto normal, checkbox vazio. |
| **Visual — comprado** | Texto riscado (line-through), cor `muted-foreground` (cinza), checkbox marcado. |
| **Agrupamento** | Itens comprados agrupados ao final da lista automaticamente, separados por divider *"Comprados (N)"*. |
| **Critério de aceite** | CS-03 — mudança de estado em < 300ms com animação de transição. |

### RF010 — Categorias

| Item | Descrição |
| --- | --- |
| **Descrição** | Itens podem ser associados a uma categoria para organização visual. |
| **Tipo** | Enum fixo no banco. Não editável pelo usuário no MVP. |
| **Categorias disponíveis** | Hortifruti • Açougue • Padaria • Limpeza • Higiene • Bebidas • Outros |
| **Exibição** | Ícone colorido ao lado do item indicando a categoria. |
| **Padrão** | Se não selecionada, categoria = "Outros". |
| **Critério de aceite** | Dropdown exibe exatamente as 7 categorias. Item salvo com categoria correta. |

---

## 6. Requisitos Não Funcionais

| ID | Requisito | Critério mensurável |
| --- | --- | --- |
| RNF001 | Mobile First | Layout projetado para 375px. Sem scroll horizontal em telas ≥ 320px. |
| RNF002 | Responsividade e ergonomia | Funcional em Android, iOS, tablets e desktop (mín. 320px largura). **Todos os alvos tocáveis ≥ 44×44px.** |
| RNF003 | Performance | LCP < 2.5s em 4G. Interações < 300ms. TBT < 200ms. |
| RNF004 | Segurança Auth | HTTPS obrigatório. Senhas com bcrypt (cost 12). Cookies httpOnly + SameSite=Lax + Secure. CSRF token nas mutations. JWT com denylist no logout. |
| RNF005 | Segurança API | Todas as rotas autenticadas verificam userId da sessão. Sem IDOR possível. |
| RNF006 | Resiliência de rede | TanStack Query mantém cache em memória durante a sessão. Falha de rede exibe toast com retry automático (3 tentativas, backoff exponencial). Sem persistência offline. |
| RNF007 | Escalabilidade | Arquitetura modular permite extração de serviços na Fase 3 sem reescrita. |
| RNF008 | Acessibilidade | Score Lighthouse Accessibility ≥ 90. Labels em todos os inputs. Navegação por VoiceOver/TalkBack validada manualmente no fluxo principal. |
| RNF009 | Compatibilidade | Suporte aos últimos 2 majors de Chrome, Safari, Firefox e Edge. Safari iOS ≥ 15. |
| RNF010 | Rate limiting | 100 mutations/minuto por usuário autenticado. 5 tentativas de login/15min por IP+email. 3 solicitações de reset de senha/hora por email. Resposta 429 com header `Retry-After`. |

---

## 7. Modelagem de Dados

### Entidades e relacionamentos

```
User 1 ──< ShoppingList N   (um usuário tem muitas listas)
ShoppingList 1 ──< Item N   (uma lista tem muitos itens)
Category (enum) ──< Item N  (uma categoria é usada por muitos itens)
PasswordResetToken N >── 1 User  (tokens de reset associados a um usuário)
```

### User

| Campo | Tipo | Restrições | Notas |
| --- | --- | --- | --- |
| `id` | String (cuid) | PK | Gerado automaticamente |
| `email` | String | UNIQUE, NOT NULL, lowercase | Email do usuário |
| `passwordHash` | String | NOT NULL | bcrypt hash, cost 12 |
| `name` | String? | Nullable, max: 60 | Nome de exibição |
| `failedLoginAttempts` | Int | NOT NULL, default: 0 | Reset após login bem-sucedido |
| `lockedUntil` | DateTime? | Nullable | Timestamp até quando a conta está bloqueada |
| `createdAt` | DateTime | NOT NULL, default: now() | |
| `updatedAt` | DateTime | NOT NULL, auto-update | |

### PasswordResetToken

| Campo | Tipo | Restrições | Notas |
| --- | --- | --- | --- |
| `id` | String (cuid) | PK | |
| `userId` | String | FK → User.id, NOT NULL | Cascade delete |
| `tokenHash` | String | UNIQUE, NOT NULL | Hash SHA-256 do token enviado por email |
| `expiresAt` | DateTime | NOT NULL | 30 minutos após criação |
| `usedAt` | DateTime? | Nullable | Marca uso para invalidar reutilização |
| `createdAt` | DateTime | NOT NULL, default: now() | |

> **Nota:** o token enviado por email é uma string aleatória de 32 bytes em base64url. O banco armazena apenas o hash SHA-256 do token — nunca o token em claro.

### ShoppingList

| Campo | Tipo | Restrições | Notas |
| --- | --- | --- | --- |
| `id` | String (cuid) | PK | |
| `title` | String | NOT NULL, max: 100 | Nome da lista |
| `userId` | String | FK → User.id, NOT NULL | Cascade delete se user for removido |
| `createdAt` | DateTime | NOT NULL, default: now() | |
| `updatedAt` | DateTime | NOT NULL, auto-update | Usado para ordenação na listagem |

### Category (Enum)

| Valor do Enum | Label de exibição | Ícone sugerido |
| --- | --- | --- |
| `HORTIFRUTI` | Hortifruti | 🥦 |
| `ACOUGUE` | Açougue | 🥩 |
| `PADARIA` | Padaria | 🍞 |
| `LIMPEZA` | Limpeza | 🧹 |
| `HIGIENE` | Higiene | 🧴 |
| `BEBIDAS` | Bebidas | 🧃 |
| `OUTROS` | Outros | 📦 |

### Item

| Campo | Tipo | Restrições | Notas |
| --- | --- | --- | --- |
| `id` | String (cuid) | PK | |
| `listId` | String | FK → ShoppingList.id, NOT NULL | Cascade delete se lista for removida |
| `name` | String | NOT NULL, max: 120 | Nome do produto |
| `quantity` | Int | NOT NULL, default: 1, min: 1, max: 999 | |
| `checked` | Boolean | NOT NULL, default: false | True = comprado |
| `category` | Category | NOT NULL, default: `OUTROS` | Enum fixo — não free text |
| `order` | Int | NOT NULL, default: 0 | Reservado para reordenação futura (Fase 2). Sem endpoint no MVP — ver ADR-005 |
| `createdAt` | DateTime | NOT NULL, default: now() | |
| `updatedAt` | DateTime | NOT NULL, auto-update | |

---

## 8. Arquitetura Técnica

### Stack tecnológica

| Camada | Tecnologia | Justificativa |
| --- | --- | --- |
| Frontend | Next.js | SSR + RSC nativos, otimização mobile, deploy fácil na Vercel |
| Backend | Route Handlers (Next.js) | Monólito modular — sem servidor separado no MVP |
| Linguagem | TypeScript strict | Segurança de tipos end-to-end |
| Banco de dados | PostgreSQL (Neon) | Relacional, confiável, serverless |
| ORM | Prisma | Type-safety, migrations automáticas, DX excelente |
| UI base | **Tailwind CSS + shadcn/ui** | Velocidade de desenvolvimento + componentes acessíveis |
| Estado global | Zustand | Simples, sem boilerplate, ideal para MVP |
| Data fetching | TanStack Query | Cache, retry, optimistic updates nativos |
| Autenticação | Auth.js v5 (Credentials Provider) | Sessão JWT/cookie, bcrypt nativo |
| Hash de senha | bcrypt (`bcryptjs`) | Padrão da indústria, cost factor 12 |
| Email transacional | Resend (ou SMTP) | Para reset de senha |
| Rate limiting | Upstash Ratelimit (Redis) | Edge-compatible, integra com Vercel |
| Validação | Zod | Schemas compartilhados client/server |
| Deploy | Vercel | Zero config com Next.js, CI/CD automático |

### Estrutura de diretórios (Clean Architecture Leve)

```
src/
  app/                        ← Rotas Next.js (pages + API routes)
    (auth)/
      login/
      signup/
      forgot-password/
      reset-password/
    (app)/
      lists/                  ← Tela de listas
      lists/[id]/             ← Tela de itens da lista
    api/v1/                   ← Route Handlers
  modules/
    auth/                     ← signup, login, reset, bcrypt utils
    shopping-list/            ← use-cases, repository, types
    item/                     ← use-cases, repository, types
    user/                     ← perfil, sessão
    shared/                   ← erros, utils, validators (Zod schemas)
  components/
    ui/                       ← shadcn components
    feature/                  ← componentes de domínio
  lib/
    prisma.ts
    auth.ts                   ← Auth.js config
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

---

## 9. Contrato de API

### Convenções

- Prefixo: `/api/v1/` em todos os endpoints
- Formato: JSON em todas as rotas
- Autenticação: verificação de sessão em todas as rotas — retorna `401` se ausente
- Autorização: verificação de `userId` em todas as operações — retorna `403` se recurso não pertence ao usuário (previne IDOR)
- Rate limit: retorna `429` com header `Retry-After` quando aplicável

### Formato padrão de erro

```json
{
  "error": {
    "code": "LIST_NOT_FOUND",
    "message": "Lista não encontrada"
  }
}
```

### Endpoints

| Método | Rota | Descrição | Códigos de retorno |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/signup` | Cria nova conta | 201, 400, 409, 422, 429 |
| POST | `/api/v1/auth/login` | Autentica usuário | 200, 401, 422, 429 |
| POST | `/api/v1/auth/logout` | Invalida sessão | 204 |
| POST | `/api/v1/auth/forgot-password` | Envia email de reset | 202, 422, 429 |
| POST | `/api/v1/auth/reset-password` | Redefine senha via token | 200, 400, 401, 422 |
| GET | `/api/v1/lists` | Lista todas as listas do usuário | 200, 401 |
| POST | `/api/v1/lists` | Cria nova lista | 201, 400, 401, 422, 429 |
| PATCH | `/api/v1/lists/:id` | Renomeia lista | 200, 400, 401, 403, 404 |
| DELETE | `/api/v1/lists/:id` | Exclui lista + itens (cascata) | 204, 401, 403, 404 |
| GET | `/api/v1/lists/:id/items` | Lista itens de uma lista | 200, 401, 403, 404 |
| POST | `/api/v1/lists/:id/items` | Adiciona item à lista | 201, 400, 401, 403, 422, 429 |
| PATCH | `/api/v1/items/:id` | Edita item (nome, qtd, categoria **ou** checked) | 200, 400, 401, 403, 404 |
| DELETE | `/api/v1/items/:id` | Remove item | 204, 401, 403, 404 |

> **Nota:** o endpoint `PATCH /items/:id/check` da v1.1 foi removido. A operação de marcar/desmarcar usa o endpoint unificado `PATCH /items/:id` com body `{ "checked": true|false }`.

---

## 10. UX, Design System e Fluxos de Tela

### 10.1. Design Tokens (Tailwind + shadcn/ui)

A stack visual usa **Tailwind + shadcn/ui** com tema padrão (CSS variables HSL). Sem Dark Mode no MVP — o tema é claro fixo. A escala tipográfica e a paleta semântica abaixo devem ser configuradas no `tailwind.config.ts` e `globals.css`.

#### Tipografia

| Token | Tamanho | Peso | Uso |
| --- | --- | --- | --- |
| `text-3xl` | 30px | 700 | Título de tela (h1) |
| `text-2xl` | 24px | 600 | Subtítulo de seção (h2) |
| `text-xl` | 20px | 600 | Título de card / modal |
| `text-base` | 16px | 400 | Corpo padrão |
| `text-sm` | 14px | 400 | Metadados (data, contador) |
| `text-xs` | 12px | 500 | Labels, badges |

Fonte primária: **Inter** (via `next/font/google`). Fallback: system sans-serif.

#### Cores semânticas (variáveis CSS do shadcn)

| Variável | Uso |
| --- | --- |
| `--primary` | Ações principais (botão "Criar", FAB) |
| `--destructive` | Ações destrutivas (excluir lista/item) |
| `--muted-foreground` | Texto secundário e itens comprados (riscados) |
| `--accent` | Hover/focus states |
| `--border` | Dividers e bordas de card |

#### Componentes shadcn obrigatórios no MVP

`Button`, `Input`, `Label`, `Dialog`, `Drawer`, `AlertDialog`, `Toast` (Sonner), `Checkbox`, `Select`, `Card`, `Progress`, `Form` (com react-hook-form), `DropdownMenu`.

### 10.2. Princípios de UX

| Princípio | Como aplicar |
| --- | --- |
| Uma mão só | Ações principais na metade inferior da tela (thumb zone). Botão de ação principal flutuante (FAB) no canto inferior direito. |
| Zero fricção | Em lista vazia, teclado abre automaticamente. Enter = adicionar + limpar campo. |
| Feedback imediato | Optimistic update: item aparece antes da confirmação do servidor. |
| Erros amigáveis | Nunca exibir erros técnicos. Toast com linguagem simples e ação de retry. |
| Estado vazio útil | Telas sem conteúdo têm ilustração + mensagem encorajadora + CTA. |
| Alvos de toque | Mínimo 44×44px em todos os elementos interativos. |

### 10.3. Fluxo principal — compra no mercado

1. Usuário abre o app → tela de login (ou listas, se já autenticado)
2. Toca em uma lista existente → abre a lista com itens
3. Se lista vazia: campo de input com foco automático e teclado aberto
4. Digita "Arroz" + Enter → item adicionado, campo limpo, foco mantido
5. Digita "Feijão 2kg" + Enter → item adicionado
6. Vai ao mercado. Toca em "Arroz" → item marcado (riscado), vai para o grupo "Comprados"
7. Repete até lista vazia → barra de progresso chega a 100%

### 10.4. Fluxo de cadastro (novo usuário)

1. Tela de login → toca em "Criar conta"
2. Preenche email, senha (com validação inline) e nome (opcional)
3. Toca em "Criar conta" → conta criada + login automático
4. Redirecionado para tela de listas (estado vazio) → CTA para criar primeira lista

### 10.5. Fluxo de recuperação de senha

1. Tela de login → "Esqueci minha senha"
2. Informa email → toast: *"Se o email existir, enviamos as instruções."*
3. Recebe email com link → toca no link → tela de "Nova senha"
4. Define nova senha + confirma → redirect para login com toast *"Senha redefinida. Faça login."*

### 10.6. Fluxo de erro — rede indisponível

1. Usuário perde conexão durante o uso
2. TanStack Query detecta falha na request
3. Toast aparece: *"Sem conexão. Tentando novamente..."*
4. Retry automático com backoff exponencial (3 tentativas)
5. Dados do cache em memória continuam visíveis (read-only)
6. Ao reconectar: toast *"Conexão restaurada"* + sync automático

---

## 11. Estratégia de Testes

| Tipo | Ferramenta | O que cobrir | Meta de cobertura |
| --- | --- | --- | --- |
| Unitário | Vitest | Regras de negócio, validações Zod, use-cases dos módulos, hash de senha | ≥ 80% das funções de negócio |
| Integração | Vitest + testcontainers | Route Handlers + Prisma (banco real) + auth | Todos os endpoints da API |
| E2E | Playwright | Fluxo principal mobile (375px): cadastro → criar lista → adicionar itens → marcar comprados | Fluxo feliz + 3 fluxos de erro críticos |

### Casos de teste obrigatórios

- Cadastro com email duplicado retorna 409 com mensagem correta
- Senha curta (< 8 chars) ou sem letras/números é rejeitada com 422
- Login com credenciais inválidas retorna mensagem genérica (não vaza existência de email)
- 5 tentativas de login falhas bloqueiam conta por 15 minutos
- Token de reset expira após 30 minutos
- Token de reset é invalidado após primeiro uso
- Usuário não autenticado recebe 401 em todas as rotas protegidas
- Usuário A não acessa lista do Usuário B (IDOR)
- Limite de 50 listas bloqueia criação com mensagem correta
- Limite de 200 itens bloqueia adição com mensagem correta
- Exclusão de lista remove todos os itens em cascata
- Undo de exclusão de item funciona dentro de 5 segundos
- Rate limit de mutations retorna 429 com `Retry-After`

---

## 12. CI/CD

| Etapa | Ferramenta | Critério de bloqueio |
| --- | --- | --- |
| Lint | ESLint + Prettier | Zero warnings — bloqueia merge se lint falhar |
| Typecheck | `tsc --noEmit` | Zero erros de tipo |
| Unitários | Vitest | 100% dos testes passando |
| Integração | Vitest | 100% dos testes passando |
| Build | `next build` | Build sem erros |
| Deploy preview | Vercel | Deploy automático em PR |
| Deploy produção | Vercel | Automático ao merge na `main` |

### Variáveis de ambiente obrigatórias

```
DATABASE_URL
AUTH_SECRET                  # secret do Auth.js / JWT
PASSWORD_RESET_SECRET        # secret para assinar tokens de reset
EMAIL_FROM
RESEND_API_KEY               # (ou SMTP_*)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_APP_URL
```

---

## 13. Roadmap

| Fase | Funcionalidades | Pré-requisito |
| --- | --- | --- |
| **Fase 1 — MVP** | Auth própria (cadastro + login + reset), CRUD listas, CRUD itens, marcação, categorias fixas, responsividade, deploy | — |
| **Fase 2** | Categorias customizáveis, autocomplete de itens frequentes, reordenação drag-and-drop (usa campo `order`), filtros por categoria, confirmação de email, Dark Mode | MVP validado com usuários reais |
| **Fase 3** | Login social (Google/Apple), compartilhamento de listas, histórico de preços, sugestões automáticas (IA), recorrência de listas, PWA | Fase 2 estável |

---

## 14. Decisões de Arquitetura (ADRs)

### ADR-001 — Next.js Fullstack

**Contexto:** necessidade de stack simples com SSR, API e deploy integrados.
**Decisão:** usar Next.js com App Router e Route Handlers como API.
**Consequência:** sem servidor separado no MVP. Se a API precisar escalar independentemente, extrair para serviço próprio na Fase 3.

### ADR-002 — Monólito Modular

**Contexto:** MVP com time pequeno e prazo curto.
**Decisão:** monólito com separação por módulos de domínio (`auth`, `shopping-list`, `item`, `user`).
**Consequência:** velocidade de entrega alta. Módulos podem ser extraídos como microserviços na Fase 3 sem reescrita.

### ADR-003 — PostgreSQL com Prisma

**Contexto:** dados relacionais com necessidade de migrations controladas.
**Decisão:** PostgreSQL hospedado no Neon (serverless), ORM Prisma.
**Consequência:** type-safety end-to-end, migrations versionadas, suporte nativo no Vercel.

### ADR-004 — Category como Enum

**Contexto:** categorias são fixas no MVP e não editáveis pelo usuário.
**Decisão:** `category` é Enum no banco com 7 valores fixos.
**Consequência:** sem JOIN. Se categorias customizáveis forem necessárias na Fase 2, criar migração para FK.

### ADR-005 — Campo `order` reservado mas sem endpoint no MVP

**Contexto:** a Fase 2 prevê reordenação drag-and-drop. Adicionar o campo agora evita migração futura.
**Decisão:** manter `order: Int` no schema do Item com `default: 0`, mas **não expor endpoint** de reordenação no v1. Todos os itens são criados com `order = 0` no MVP; a ordenação visual segue `createdAt` ascendente.
**Consequência:** zero impacto no MVP. Quando a Fase 2 chegar, basta popular o campo via migration (`SET order = ROW_NUMBER()`) e adicionar `PATCH /api/v1/lists/:id/items/reorder`.

### ADR-006 — Foco automático apenas em lista vazia (RF006 × RF008)

**Contexto:** o RF006 original abria o teclado automaticamente ao entrar em qualquer lista. Combinado com o swipe-to-delete do RF008, o teclado cobria a metade inferior da tela e impossibilitava o swipe em itens já presentes.
**Decisão:** foco automático no input apenas quando a lista está vazia. Em listas com itens, o input fica visível mas sem foco automático; o teclado abre só ao toque do usuário.
**Consequência:** preserva a experiência "zero fricção" no primeiro uso (caso mais comum) sem comprometer a interação com itens existentes.

### ADR-007 — Autenticação própria com bcrypt + Auth.js Credentials

**Contexto:** o produto não usará login social no MVP. É necessária autenticação própria com armazenamento seguro de credenciais.
**Decisão:** Auth.js v5 com Credentials Provider, bcrypt (cost 12) para hash, JWT em cookie httpOnly com expiração de 30 dias. Tokens de reset de senha armazenados como hash SHA-256 no banco, com expiração de 30 minutos e invalidação após uso.
**Consequência:** controle total do fluxo de autenticação. Em contrapartida, exige rate limiting agressivo (RNF010) para mitigar brute force, e infraestrutura de email transacional para o fluxo de reset.

---

## 15. Glossário

| Termo | Definição |
| --- | --- |
| Optimistic update | Atualização imediata da UI antes da confirmação do servidor, revertida se a request falhar. |
| IDOR | Insecure Direct Object Reference — acesso a recursos de outro usuário via manipulação de ID. |
| FAB | Floating Action Button — botão de ação principal flutuante. |
| Cascade delete | Exclusão automática de registros dependentes ao remover o registro pai. |
| LCP | Largest Contentful Paint — tempo de carregamento do maior elemento visível. |
| TBT | Total Blocking Time — tempo em que a thread principal ficou bloqueada. |
| Thumb zone | Área da tela acessível pelo polegar com uma mão (metade inferior do celular). |
| bcrypt cost factor | Parâmetro que define o número de iterações do hash (2^cost). 12 é o padrão atual da indústria. |
| Denylist (JWT) | Lista de tokens JWT invalidados antes da expiração natural, consultada a cada request. |
| Backoff exponencial | Estratégia de retry onde o intervalo entre tentativas dobra a cada falha (ex: 1s, 2s, 4s). |

---

**SmartList PRD v1.2** • Revisão sênior aplicada • Stack confirmada: Next.js + Tailwind + shadcn/ui • Pronto para desenvolvimento
