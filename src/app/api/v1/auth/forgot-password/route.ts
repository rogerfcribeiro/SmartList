import { NextRequest } from 'next/server';
import { forgotPasswordUseCase } from '@/modules/auth/use-cases/forgot-password';
import { forgotPasswordSchema } from '@/modules/shared/validators';
import { apiSuccess, apiError } from '@/modules/shared/http';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);
    await forgotPasswordUseCase(email);
    return apiSuccess(
      { message: 'Se o email existir, enviamos as instruções.' },
      202,
    );
  } catch (error) {
    return apiError(error);
  }
}
