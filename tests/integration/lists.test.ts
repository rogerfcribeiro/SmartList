import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { shoppingListRepo } from '@/modules/shopping-list/repository';
import { signupUseCase } from '@/modules/auth/use-cases/signup';

const available = process.env.POSTGRES_AVAILABLE === 'true';

describe.skipIf(!available)('ShoppingList — Integração', () => {
  let userId: string;
  let userId2: string;

  beforeEach(async () => {
    await prisma.item.deleteMany();
    await prisma.shoppingList.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany();

    const user1 = await signupUseCase({ email: 'lists1@test.com', password: 'Senha123' });
    const user2 = await signupUseCase({ email: 'lists2@test.com', password: 'Senha123' });
    userId = user1.id;
    userId2 = user2.id;
  });

  describe('create', () => {
    it('cria lista no banco', async () => {
      const list = await shoppingListRepo.create(userId, 'Minha Lista');
      expect(list.id).toBeTruthy();
      expect(list.title).toBe('Minha Lista');
      expect(list.userId).toBe(userId);
    });
  });

  describe('findAllByUser', () => {
    it('retorna apenas listas do usuário', async () => {
      await shoppingListRepo.create(userId, 'Lista A');
      await shoppingListRepo.create(userId, 'Lista B');
      await shoppingListRepo.create(userId2, 'Lista de Outro');

      const lists = await shoppingListRepo.findAllByUser(userId);
      expect(lists).toHaveLength(2);
      expect(lists.every((l) => l.userId === userId)).toBe(true);
    });

    it('inclui contagem de itens', async () => {
      const list = await shoppingListRepo.create(userId, 'Lista com itens');
      await prisma.item.create({
        data: { listId: list.id, name: 'Arroz', quantity: 1, category: 'OUTROS', order: 0 },
      });

      const lists = await shoppingListRepo.findAllByUser(userId);
      expect(lists[0]._count.items).toBe(1);
    });

    it('inclui apenas itens checked no campo items', async () => {
      const list = await shoppingListRepo.create(userId, 'Lista');
      await prisma.item.createMany({
        data: [
          { listId: list.id, name: 'Arroz', quantity: 1, category: 'OUTROS', order: 0, checked: false },
          { listId: list.id, name: 'Feijão', quantity: 1, category: 'OUTROS', order: 0, checked: true },
        ],
      });

      const lists = await shoppingListRepo.findAllByUser(userId);
      expect(lists[0].items).toHaveLength(1);
      expect(lists[0]._count.items).toBe(2);
    });

    it('ordena por updatedAt desc', async () => {
      const l1 = await shoppingListRepo.create(userId, 'Antiga');
      await new Promise((r) => setTimeout(r, 10));
      await shoppingListRepo.create(userId, 'Recente');

      const lists = await shoppingListRepo.findAllByUser(userId);
      expect(lists[0].title).toBe('Recente');
      expect(lists[1].id).toBe(l1.id);
    });
  });

  describe('countByUser', () => {
    it('conta listas corretamente', async () => {
      await shoppingListRepo.create(userId, 'L1');
      await shoppingListRepo.create(userId, 'L2');
      await shoppingListRepo.create(userId2, 'Outro');

      expect(await shoppingListRepo.countByUser(userId)).toBe(2);
      expect(await shoppingListRepo.countByUser(userId2)).toBe(1);
    });
  });

  describe('findByIdAndUser — IDOR protection', () => {
    it('retorna lista quando usuário correto', async () => {
      const list = await shoppingListRepo.create(userId, 'Minha');
      const found = await shoppingListRepo.findByIdAndUser(list.id, userId);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(list.id);
    });

    it('retorna null quando userId diverge (IDOR)', async () => {
      const list = await shoppingListRepo.create(userId, 'Só minha');
      const found = await shoppingListRepo.findByIdAndUser(list.id, userId2);
      expect(found).toBeNull();
    });

    it('retorna null para id inexistente', async () => {
      const found = await shoppingListRepo.findByIdAndUser('nao-existe', userId);
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('renomeia lista', async () => {
      const list = await shoppingListRepo.create(userId, 'Original');
      const updated = await shoppingListRepo.update(list.id, 'Renomeada');
      expect(updated.title).toBe('Renomeada');
    });
  });

  describe('delete', () => {
    it('remove lista do banco', async () => {
      const list = await shoppingListRepo.create(userId, 'Para excluir');
      await shoppingListRepo.delete(list.id);
      const found = await prisma.shoppingList.findUnique({ where: { id: list.id } });
      expect(found).toBeNull();
    });

    it('remove itens em cascata', async () => {
      const list = await shoppingListRepo.create(userId, 'Com itens');
      await prisma.item.create({
        data: { listId: list.id, name: 'Item', quantity: 1, category: 'OUTROS', order: 0 },
      });

      await shoppingListRepo.delete(list.id);

      const items = await prisma.item.findMany({ where: { listId: list.id } });
      expect(items).toHaveLength(0);
    });
  });
});
