import { NextRequest } from 'next/server';
import { resetPasswordUseCase } from '@/modules/auth/use-cases/reset-password';
import { resetPasswordSchema } from '@/modules/shared/validators';
import { apiSuccess, apiError } from '@/modules/shared/http';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);
    await resetPasswordUseCase(token, password);
    return apiSuccess({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    return apiError(error);
  }
}
