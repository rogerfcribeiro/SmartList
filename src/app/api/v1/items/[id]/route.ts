import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/modules/shared/session';
import { itemRepo } from '@/modules/item/repository';
import { updateItemSchema } from '@/modules/shared/validators';
import { checkMutationRateLimit } from '@/modules/shared/with-rate-limit';
import { Errors } from '@/modules/shared/errors';
import { apiSuccess, apiError } from '@/modules/shared/http';
import { Category } from '@prisma/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    await checkMutationRateLimit(user.id);

    const { id } = await params;
    const item = await itemRepo.findById(id);
    if (!item || item.list.userId !== user.id) throw Errors.NOT_FOUND('Item');

    const body = await req.json();
    const data = updateItemSchema.parse(body);
    const updated = await itemRepo.update(id, {
      ...data,
      category: data.category as Category | undefined,
    });
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
    const item = await itemRepo.findById(id);
    if (!item || item.list.userId !== user.id) throw Errors.NOT_FOUND('Item');

    await itemRepo.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
