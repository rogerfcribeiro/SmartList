import { test, expect, type Page } from '@playwright/test';

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`;
}

async function signupAndLogin(page: Page): Promise<void> {
  const email = uniqueEmail();
  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill('Senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL('**/lists', { timeout: 15_000 });
}

// ── Fluxo 2: Criar lista ─────────────────────────────────────────────────────

test('Fluxo 2 — Criar lista: FAB → modal → nome → card aparece', async ({ page }) => {
  await signupAndLogin(page);

  // Tela de listas está vazia
  await expect(page.getByText('Nenhuma lista ainda')).toBeVisible();

  // Toca no FAB (+)
  await page.getByRole('button', { name: 'Nova lista' }).click();

  // Modal abre
  await expect(page.getByRole('dialog')).toBeVisible();

  // Digita nome da lista
  const input = page.getByRole('dialog').getByRole('textbox');
  await input.fill('Feira da semana');

  // Confirma (Enter ou botão)
  await input.press('Enter');

  // Card da lista aparece na tela
  await expect(page.getByText('Feira da semana')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Nenhuma lista ainda')).not.toBeVisible();
});

test('Fluxo 2 — Criar lista: CS-01 — criação em ≤ 3 interações', async ({ page }) => {
  await signupAndLogin(page);

  // Interação 1: toca no FAB
  await page.getByRole('button', { name: 'Nova lista' }).click();

  // Interação 2: digita o nome
  await page.getByRole('dialog').getByRole('textbox').fill('Lista Rápida');

  // Interação 3: confirma
  await page.getByRole('dialog').getByRole('textbox').press('Enter');

  await expect(page.getByText('Lista Rápida')).toBeVisible({ timeout: 5_000 });
});

test('Fluxo 2 — Criar lista: múltiplas listas ficam visíveis', async ({ page }) => {
  await signupAndLogin(page);

  const nomes = ['Compras', 'Farmácia', 'Feira'];

  for (const nome of nomes) {
    await page.getByRole('button', { name: 'Nova lista' }).click();
    await page.getByRole('dialog').getByRole('textbox').fill(nome);
    await page.getByRole('dialog').getByRole('textbox').press('Enter');
    await page.waitForTimeout(300);
  }

  for (const nome of nomes) {
    await expect(page.getByText(nome)).toBeVisible();
  }
});

test('Fluxo 2 — Criar lista: abre lista ao clicar no card', async ({ page }) => {
  await signupAndLogin(page);

  await page.getByRole('button', { name: 'Nova lista' }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('Minha Lista');
  await page.getByRole('dialog').getByRole('textbox').press('Enter');

  // Clica no card da lista
  await page.getByText('Minha Lista').click();

  // Deve navegar para /lists/[id]
  await page.waitForURL(/\/lists\/[a-z0-9]+/, { timeout: 5_000 });
  await expect(page.getByPlaceholder('Adicionar item…')).toBeVisible();
});
