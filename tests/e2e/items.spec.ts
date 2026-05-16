import { test, expect, type Page } from '@playwright/test';

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`;
}

async function signupAndGoToList(page: Page): Promise<void> {
  // Signup
  const email = uniqueEmail();
  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill('Senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL('**/lists', { timeout: 15_000 });

  // Cria lista
  await page.getByRole('button', { name: 'Nova lista' }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('Teste Itens');
  await page.getByRole('dialog').getByRole('textbox').press('Enter');

  // Entra na lista
  await page.getByText('Teste Itens').click();
  await page.waitForURL(/\/lists\/[a-z0-9]+/, { timeout: 5_000 });
}

async function addItem(page: Page, name: string) {
  await page.getByPlaceholder('Adicionar item…').fill(name);
  await page.getByPlaceholder('Adicionar item…').press('Enter');
}

// ── Fluxo 3: Adicionar itens ─────────────────────────────────────────────────

test('Fluxo 3 — Adicionar itens: Enter-Enter adiciona múltiplos itens', async ({ page }) => {
  await signupAndGoToList(page);

  await addItem(page, 'Arroz');
  await addItem(page, 'Feijão');

  // Os 2 itens devem estar visíveis
  await expect(page.getByRole('checkbox', { name: 'Arroz' })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('checkbox', { name: 'Feijão' })).toBeVisible({ timeout: 5_000 });
});

test('Fluxo 3 — Adicionar itens: CS-02 — 5 itens em ≤ 60s', async ({ page }) => {
  await signupAndGoToList(page);

  const itens = ['Arroz', 'Feijão', 'Macarrão', 'Azeite', 'Sal'];
  const start = Date.now();

  for (const item of itens) {
    await addItem(page, item);
  }

  for (const item of itens) {
    await expect(page.getByRole('checkbox', { name: item })).toBeVisible({ timeout: 5_000 });
  }

  expect(Date.now() - start).toBeLessThan(60_000);
});

test('Fluxo 3 — Adicionar itens: campo limpa após adicionar', async ({ page }) => {
  await signupAndGoToList(page);

  await page.getByPlaceholder('Adicionar item…').fill('Leite');
  await page.getByPlaceholder('Adicionar item…').press('Enter');

  await expect(page.getByPlaceholder('Adicionar item…')).toHaveValue('');
});

// ── Fluxo 4: Marcar comprado ─────────────────────────────────────────────────

test('Fluxo 4 — Marcar comprado: item vai para seção Comprados', async ({ page }) => {
  await signupAndGoToList(page);

  await addItem(page, 'Arroz');
  await addItem(page, 'Feijão');

  // Ambos iniciam em Pendentes
  await expect(page.getByRole('region', { name: 'Pendentes' })).toBeVisible();

  // Toca em "Arroz" para marcar como comprado
  await page.getByRole('checkbox', { name: 'Arroz' }).click();

  // Seção Comprados aparece com "Arroz"
  await expect(page.getByRole('region', { name: 'Comprados' })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('region', { name: 'Comprados' })).toContainText('Arroz');
});

test('Fluxo 4 — Marcar comprado: progresso mostra 50% com 1 de 2 comprado', async ({ page }) => {
  await signupAndGoToList(page);

  await addItem(page, 'Arroz');
  await addItem(page, 'Feijão');

  await page.getByRole('checkbox', { name: 'Arroz' }).click();

  // Progresso 50% deve estar visível
  await expect(page.getByText('50%')).toBeVisible({ timeout: 5_000 });
});

test('Fluxo 4 — Marcar comprado: CS-03 — feedback em < 300ms (optimistic update)', async ({ page }) => {
  await signupAndGoToList(page);
  await addItem(page, 'Arroz');

  await expect(page.getByRole('checkbox', { name: 'Arroz' })).toBeVisible();

  const start = Date.now();
  await page.getByRole('checkbox', { name: 'Arroz' }).click();

  // Item deve mover para Comprados rapidamente (optimistic update)
  await expect(page.getByRole('region', { name: 'Comprados' })).toBeVisible();
  expect(Date.now() - start).toBeLessThan(300);
});

// ── Fluxo 5: Undo exclusão ───────────────────────────────────────────────────

test('Fluxo 5 — Undo exclusão: item restaurado ao clicar Desfazer', async ({ page }) => {
  await signupAndGoToList(page);
  await addItem(page, 'Arroz');

  // Aguarda item aparecer
  const itemCard = page.getByRole('checkbox', { name: 'Arroz' });
  await expect(itemCard).toBeVisible();

  // Swipe para esquerda para revelar botão de deletar
  const box = await itemCard.boundingBox();
  if (!box) throw new Error('ItemCard bounding box não encontrado');

  // Simula swipe: pointer down → move left → pointer up
  await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
  await page.mouse.down();
  for (let dx = 0; dx <= 70; dx += 10) {
    await page.mouse.move(box.x + box.width - 20 - dx, box.y + box.height / 2);
  }
  await page.mouse.up();

  // Botão Excluir deve aparecer
  await expect(page.getByRole('button', { name: 'Excluir' }).first()).toBeVisible({ timeout: 2_000 });
  await page.getByRole('button', { name: 'Excluir' }).first().click();

  // Toast com Desfazer aparece
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeVisible({ timeout: 3_000 });

  // Clica Desfazer
  await page.getByRole('button', { name: 'Desfazer' }).click();

  // Item restaurado
  await expect(page.getByRole('checkbox', { name: 'Arroz' })).toBeVisible({ timeout: 3_000 });
});

test('Fluxo 5 — Undo exclusão: item removido definitivamente se Desfazer não clicado', async ({ page }) => {
  await signupAndGoToList(page);
  await addItem(page, 'Leite');

  const itemCard = page.getByRole('checkbox', { name: 'Leite' });
  await expect(itemCard).toBeVisible();

  const box = await itemCard.boundingBox();
  if (!box) throw new Error('ItemCard bounding box não encontrado');

  await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
  await page.mouse.down();
  for (let dx = 0; dx <= 70; dx += 10) {
    await page.mouse.move(box.x + box.width - 20 - dx, box.y + box.height / 2);
  }
  await page.mouse.up();

  await expect(page.getByRole('button', { name: 'Excluir' }).first()).toBeVisible({ timeout: 2_000 });
  await page.getByRole('button', { name: 'Excluir' }).first().click();

  // Item sumiu otimisticamente
  await expect(page.getByRole('checkbox', { name: 'Leite' })).not.toBeVisible({ timeout: 2_000 });

  // Aguarda os 5s de undo e mais 2s de margem
  // (não clicar Desfazer — verificar que estado vazio aparece)
  await page.waitForTimeout(7_000);
  await expect(page.getByText('Nenhum item ainda')).toBeVisible();
});
