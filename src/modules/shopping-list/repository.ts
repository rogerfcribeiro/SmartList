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
    return prisma.shoppingList.create({ data: { userId, title } });
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
