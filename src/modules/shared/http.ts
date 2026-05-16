import { NextResponse } from 'next/server';
import { AppError } from './errors';

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: unknown) {
  if (error instanceof AppError) {
    const headers: Record<string, string> = {};
    if ('retryAfter' in error && typeof (error as { retryAfter?: number }).retryAfter === 'number') {
      headers['Retry-After'] = String((error as { retryAfter?: number }).retryAfter);
    }
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode, headers },
    );
  }
  console.error('[Unhandled API Error]', error);
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.' } },
    { status: 500 },
  );
}
