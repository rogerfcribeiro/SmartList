import { NextRequest } from 'next/server';
import { requireSession } from '@/modules/shared/session';
import { shoppingListRepo } from '@/modules/shopping-list/repository';
import { createListSchema } from '@/modules/shared/validators';
import { checkMutationRateLimit } from '@/modules/shared/with-rate-limit';
import { Errors } from '@/modules/shared/errors';
import { apiSuccess, apiError } from '@/modules/shared/http';

const MAX_LISTS = 50;

export async function GET() {
  try {
    const user = await requireSession();
    const lists = await shoppingListRepo.findAllByUser(user.id);

    return apiSuccess(
      lists.map((list) => ({
        id: list.id,
        title: list.title,
        totalItems: list._count.items,
        checkedItems: list.items.length,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      })),
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    await checkMutationRateLimit(user.id);

    const body = await req.json();
    const { title } = createListSchema.parse(body);

    const count = await shoppingListRepo.countByUser(user.id);
    if (count >= MAX_LISTS) throw Errors.LIST_LIMIT_REACHED();

    const list = await shoppingListRepo.create(user.id, title);
    return apiSuccess(list, 201);
  } catch (error) {
    return apiError(error);
  }
}
