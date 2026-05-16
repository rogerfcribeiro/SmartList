import { test, expect } from '@playwright/test';

// Helpers reutilizáveis
function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`;
}

async function signup(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Criar conta' }).click();
}

// ── Fluxo 1: Cadastro ────────────────────────────────────────────────────────

test('Fluxo 1 — Cadastro: signup redireciona para /lists', async ({ page }) => {
  const email = uniqueEmail();

  await page.goto('/signup');

  // Preenche formulário
  await page.getByLabel('Nome (opcional)').fill('Teste E2E');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill('Senha123');

  // Submete
  await page.getByRole('button', { name: 'Criar conta' }).click();

  // Aguarda redirecionamento para /lists
  await page.waitForURL('**/lists', { timeout: 15_000 });
  expect(page.url()).toContain('/lists');

  // Verifica que a tela de listas está visível
  await expect(page.getByText('Minhas listas')).toBeVisible();
});

test('Fluxo 1 — Cadastro: exibe erro para email já cadastrado', async ({ page }) => {
  const email = uniqueEmail();

  // Cria conta pela primeira vez
  await signup(page, email, 'Senha123');
  await page.waitForURL('**/lists', { timeout: 15_000 });

  // Tenta criar novamente com mesmo email
  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill('Senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  // Deve exibir mensagem de erro (não redirecionar)
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 });
  expect(page.url()).toContain('/signup');
});

// ── Fluxo 6: Login bloqueado ─────────────────────────────────────────────────

test('Fluxo 6 — Login bloqueado: 5 tentativas incorretas → conta bloqueada', async ({ page }) => {
  const email = uniqueEmail();
  const correctPwd = 'Senha123';

  // Cria conta
  await signup(page, email, correctPwd);
  await page.waitForURL('**/lists', { timeout: 15_000 });

  // Navega para login
  await page.goto('/login');

  // Faz 5 tentativas com senha errada
  for (let i = 0; i < 5; i++) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Senha').fill('SenhaErrada1');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 });
    // Limpa campos para próxima tentativa
    await page.getByLabel('Senha').clear();
  }

  // 6ª tentativa — conta deve estar bloqueada (rate limit ou lockout)
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(correctPwd);
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Deve continuar na página de login com mensagem de erro
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 });
  expect(page.url()).toContain('/login');
});

test('Fluxo 6 — Login: credenciais inválidas exibem mensagem genérica', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('naoexiste@example.com');
  await page.getByLabel('Senha').fill('Senha123');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('alert')).toContainText('incorretos');
});
