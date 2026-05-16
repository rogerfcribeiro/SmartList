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

  findById(id: string) {
    return prisma.item.findUnique({ where: { id }, include: { list: true } });
  },

  update(
    id: string,
    data: Partial<{ name: string; quantity: number; category: Category; checked: boolean }>,
  ) {
    return prisma.item.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.item.delete({ where: { id } });
  },
};
