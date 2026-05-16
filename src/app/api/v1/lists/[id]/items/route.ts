import { NextRequest } from 'next/server';
import { requireSession } from '@/modules/shared/session';
import { shoppingListRepo } from '@/modules/shopping-list/repository';
import { itemRepo } from '@/modules/item/repository';
import { createItemSchema } from '@/modules/shared/validators';
import { checkMutationRateLimit } from '@/modules/shared/with-rate-limit';
import { Errors } from '@/modules/shared/errors';
import { apiSuccess, apiError } from '@/modules/shared/http';
import { Category } from '@prisma/client';

const MAX_ITEMS = 200;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const list = await shoppingListRepo.findByIdAndUser(id, user.id);
    if (!list) throw Errors.NOT_FOUND('Lista');

    const items = await itemRepo.findAllByList(id);
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    await checkMutationRateLimit(user.id);

    const { id } = await params;
    const list = await shoppingListRepo.findByIdAndUser(id, user.id);
    if (!list) throw Errors.NOT_FOUND('Lista');

    const count = await itemRepo.countByList(id);
    if (count >= MAX_ITEMS) throw Errors.ITEM_LIMIT_REACHED();

    const body = await req.json();
    const data = createItemSchema.parse(body);
    const item = await itemRepo.create(id, {
      name: data.name,
      quantity: data.quantity,
      category: data.category as Category,
    });
    return apiSuccess(item, 201);
  } catch (error) {
    return apiError(error);
  }
}
