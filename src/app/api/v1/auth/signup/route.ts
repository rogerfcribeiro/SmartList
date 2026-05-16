import { NextRequest } from 'next/server';
import { signupUseCase } from '@/modules/auth/use-cases/signup';
import { apiSuccess, apiError } from '@/modules/shared/http';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await signupUseCase(body);
    return apiSuccess(user, 201);
  } catch (error) {
    return apiError(error);
  }
}
