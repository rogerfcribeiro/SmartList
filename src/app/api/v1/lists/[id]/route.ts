import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/modules/shared/session';
import { shoppingListRepo } from '@/modules/shopping-list/repository';
import { updateListSchema } from '@/modules/shared/validators';
import { checkMutationRateLimit } from '@/modules/shared/with-rate-limit';
import { Errors } from '@/modules/shared/errors';
import { apiSuccess, apiError } from '@/modules/shared/http';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const list = await shoppingListRepo.findByIdAndUser(id, user.id);
    if (!list) throw Errors.NOT_FOUND('Lista');
    return apiSuccess({ id: list.id, title: list.title });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    await checkMutationRateLimit(user.id);

    const { id } = await params;
    const body = await req.json();
    const { title } = updateListSchema.parse(body);

    const list = await shoppingListRepo.findByIdAndUser(id, user.id);
    if (!list) throw Errors.NOT_FOUND('Lista');

    const updated = await shoppingListRepo.update(id, title);
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    await checkMutationRateLimit(user.id);

    const { id } = await params;
    const list = await shoppingListRepo.findByIdAndUser(id, user.id);
    if (!list) throw Errors.NOT_FOUND('Lista');

    await shoppingListRepo.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
