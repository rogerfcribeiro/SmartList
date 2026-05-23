import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findMany: mockFindMany,
      count: mockCount,
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

const { itemRepo } = await import('@/modules/item/repository');

const itemBase = {
  id: 'item-1',
  listId: 'list-1',
  name: 'Arroz',
  quantity: 1,
  checked: false,
  category: 'OUTROS' as const,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('itemRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllByList', () => {
    it('busca itens com ordenação correta', async () => {
      mockFindMany.mockResolvedValue([]);
      await itemRepo.findAllByList('list-1');
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { listId: 'list-1' },
        orderBy: [{ checked: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
      });
    });
  });

  describe('countByList', () => {
    it('conta itens de uma lista', async () => {
      mockCount.mockResolvedValue(10);
      const result = await itemRepo.countByList('list-1');
      expect(result).toBe(10);
    });
  });

  describe('create', () => {
    it('cria item com dados fornecidos', async () => {
      mockCreate.mockResolvedValue(itemBase);
      await itemRepo.create('list-1', { name: 'Arroz', quantity: 2, category: 'HORTIFRUTI' });
      expect(mockCreate).toHaveBeenCalledWith({
        data: { listId: 'list-1', name: 'Arroz', quantity: 2, category: 'HORTIFRUTI' },
      });
    });
  });

  describe('findById', () => {
    it('busca item por id com include de list', async () => {
      const itemWithList = { ...itemBase, list: { id: 'list-1', userId: 'user-1' } };
      mockFindUnique.mockResolvedValue(itemWithList);
      const result = await itemRepo.findById('item-1');
      expect(result).toEqual(itemWithList);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: { list: true },
      });
    });

    it('retorna null quando item não existe', async () => {
      mockFindUnique.mockResolvedValue(null);
      const result = await itemRepo.findById('inexistente');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('atualiza campos fornecidos', async () => {
      mockUpdate.mockResolvedValue({ ...itemBase, checked: true });
      await itemRepo.update('item-1', { checked: true });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { checked: true },
      });
    });

    it('atualiza múltiplos campos', async () => {
      mockUpdate.mockResolvedValue({ ...itemBase, name: 'Feijão', quantity: 3 });
      await itemRepo.update('item-1', { name: 'Feijão', quantity: 3 });
      const args = mockUpdate.mock.calls[0][0];
      expect(args.data.name).toBe('Feijão');
      expect(args.data.quantity).toBe(3);
    });
  });

  describe('delete', () => {
    it('deleta item por id', async () => {
      mockDelete.mockResolvedValue(itemBase);
      await itemRepo.delete('item-1');
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
    });
  });
});
