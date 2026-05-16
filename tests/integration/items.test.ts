import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { itemRepo } from '@/modules/item/repository';
import { signupUseCase } from '@/modules/auth/use-cases/signup';
import { shoppingListRepo } from '@/modules/shopping-list/repository';

const available = process.env.POSTGRES_AVAILABLE === 'true';

describe.skipIf(!available)('Item — Integração', () => {
  let listId: string;
  let userId: string;
  let userId2: string;
  let listId2: string;

  beforeEach(async () => {
    await prisma.item.deleteMany();
    await prisma.shoppingList.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany();

    const user1 = await signupUseCase({ email: 'items1@test.com', password: 'Senha123' });
    const user2 = await signupUseCase({ email: 'items2@test.com', password: 'Senha123' });
    userId = user1.id;
    userId2 = user2.id;

    const list = await shoppingListRepo.create(userId, 'Lista Teste');
    listId = list.id;
    const list2 = await shoppingListRepo.create(userId2, 'Lista de Outro');
    listId2 = list2.id;
  });

  describe('create', () => {
    it('cria item com dados completos', async () => {
      const item = await itemRepo.create(listId, { name: 'Arroz', quantity: 2, category: 'HORTIFRUTI' });
      expect(item.id).toBeTruthy();
      expect(item.name).toBe('Arroz');
      expect(item.quantity).toBe(2);
      expect(item.category).toBe('HORTIFRUTI');
      expect(item.checked).toBe(false);
    });

    it('cria item com order 0 por padrão', async () => {
      const item = await itemRepo.create(listId, { name: 'X', quantity: 1, category: 'OUTROS' });
      expect(item.order).toBe(0);
    });
  });

  describe('findAllByList', () => {
    it('retorna itens pendentes antes dos comprados', async () => {
      await itemRepo.create(listId, { name: 'Comprado', quantity: 1, category: 'OUTROS' });
      await prisma.item.updateMany({ where: { name: 'Comprado' }, data: { checked: true } });
      await itemRepo.create(listId, { name: 'Pendente', quantity: 1, category: 'OUTROS' });

      const items = await itemRepo.findAllByList(listId);
      expect(items[0].name).toBe('Pendente');
      expect(items[1].name).toBe('Comprado');
    });

    it('dentro do mesmo checked, ordena por createdAt asc', async () => {
      const i1 = await itemRepo.create(listId, { name: 'Primeiro', quantity: 1, category: 'OUTROS' });
      await new Promise((r) => setTimeout(r, 10));
      const i2 = await itemRepo.create(listId, { name: 'Segundo', quantity: 1, category: 'OUTROS' });

      const items = await itemRepo.findAllByList(listId);
      expect(items[0].id).toBe(i1.id);
      expect(items[1].id).toBe(i2.id);
    });

    it('retorna apenas itens da lista especificada', async () => {
      await itemRepo.create(listId, { name: 'Meu Item', quantity: 1, category: 'OUTROS' });
      await itemRepo.create(listId2, { name: 'Item de Outro', quantity: 1, category: 'OUTROS' });

      const items = await itemRepo.findAllByList(listId);
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Meu Item');
    });
  });

  describe('countByList', () => {
    it('conta itens da lista', async () => {
      await itemRepo.create(listId, { name: 'A', quantity: 1, category: 'OUTROS' });
      await itemRepo.create(listId, { name: 'B', quantity: 1, category: 'OUTROS' });
      expect(await itemRepo.countByList(listId)).toBe(2);
    });
  });

  describe('findById', () => {
    it('retorna item com lista associada', async () => {
      const created = await itemRepo.create(listId, { name: 'Leite', quantity: 1, category: 'OUTROS' });
      const found = await itemRepo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Leite');
      expect(found!.list).toBeDefined();
      expect(found!.list.userId).toBe(userId);
    });

    it('retorna null para id inexistente', async () => {
      expect(await itemRepo.findById('nao-existe')).toBeNull();
    });
  });

  describe('update', () => {
    it('atualiza checked do item', async () => {
      const item = await itemRepo.create(listId, { name: 'X', quantity: 1, category: 'OUTROS' });
      const updated = await itemRepo.update(item.id, { checked: true });
      expect(updated.checked).toBe(true);
    });

    it('atualiza name e quantity', async () => {
      const item = await itemRepo.create(listId, { name: 'Velho', quantity: 1, category: 'OUTROS' });
      const updated = await itemRepo.update(item.id, { name: 'Novo', quantity: 5 });
      expect(updated.name).toBe('Novo');
      expect(updated.quantity).toBe(5);
    });

    it('toggle checked reordena na consulta seguinte', async () => {
      const a = await itemRepo.create(listId, { name: 'A', quantity: 1, category: 'OUTROS' });
      await itemRepo.create(listId, { name: 'B', quantity: 1, category: 'OUTROS' });

      // Marca A como comprado
      await itemRepo.update(a.id, { checked: true });

      const items = await itemRepo.findAllByList(listId);
      expect(items[0].name).toBe('B');  // pendente vem primeiro
      expect(items[1].name).toBe('A');  // comprado por último
    });
  });

  describe('delete', () => {
    it('remove item do banco', async () => {
      const item = await itemRepo.create(listId, { name: 'Del', quantity: 1, category: 'OUTROS' });
      await itemRepo.delete(item.id);
      expect(await itemRepo.findById(item.id)).toBeNull();
    });
  });
});
