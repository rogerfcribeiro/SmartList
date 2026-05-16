import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    shoppingList: {
      findMany: mockFindMany,
      count: mockCount,
      create: mockCreate,
      findFirst: mockFindFirst,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

const { shoppingListRepo } = await import('@/modules/shopping-list/repository');

const listBase = {
  id: 'list-1',
  title: 'Compras',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('shoppingListRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('busca listas do usuário com include correto', async () => {
      mockFindMany.mockResolvedValue([]);
      await shoppingListRepo.findAllByUser('user-1');
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { items: true } },
          items: { where: { checked: true }, select: { id: true } },
        },
      });
    });
  });

  describe('countByUser', () => {
    it('conta listas do usuário', async () => {
      mockCount.mockResolvedValue(5);
      const result = await shoppingListRepo.countByUser('user-1');
      expect(result).toBe(5);
      expect(mockCount).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });
  });

  describe('create', () => {
    it('cria lista com userId e title', async () => {
      mockCreate.mockResolvedValue(listBase);
      await shoppingListRepo.create('user-1', 'Compras');
      expect(mockCreate).toHaveBeenCalledWith({ data: { userId: 'user-1', title: 'Compras' } });
    });
  });

  describe('findByIdAndUser', () => {
    it('busca lista por id e userId', async () => {
      mockFindFirst.mockResolvedValue(listBase);
      const result = await shoppingListRepo.findByIdAndUser('list-1', 'user-1');
      expect(result).toEqual(listBase);
      expect(mockFindFirst).toHaveBeenCalledWith({ where: { id: 'list-1', userId: 'user-1' } });
    });

    it('retorna null quando lista não pertence ao usuário (IDOR)', async () => {
      mockFindFirst.mockResolvedValue(null);
      const result = await shoppingListRepo.findByIdAndUser('list-1', 'outro-user');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('atualiza título da lista', async () => {
      mockUpdate.mockResolvedValue({ ...listBase, title: 'Novo Título' });
      await shoppingListRepo.update('list-1', 'Novo Título');
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: { title: 'Novo Título' },
      });
    });
  });

  describe('delete', () => {
    it('deleta lista por id', async () => {
      mockDelete.mockResolvedValue(listBase);
      await shoppingListRepo.delete('list-1');
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'list-1' } });
    });
  });
});
