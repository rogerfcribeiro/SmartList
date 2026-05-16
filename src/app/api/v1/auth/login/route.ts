import { NextRequest } from 'next/server';
import { signIn } from '@/lib/auth';
import { loginUseCase } from '@/modules/auth/use-cases/login';
import { loginSchema } from '@/modules/shared/validators';
import { apiSuccess, apiError } from '@/modules/shared/http';
import { AppError } from '@/modules/shared/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '127.0.0.1';
    await loginUseCase(email, password, ip);

    await signIn('credentials', { email, password, redirect: false });
    return apiSuccess({ ok: true });
  } catch (error) {
    if (error instanceof AppError) return apiError(error);
    // signIn lança um erro não-AppError em caso de credenciais inválidas pelo provider
    return apiError(new AppError('INVALID_CREDENTIALS', 'Email ou senha incorretos.', 409));
  }
}
