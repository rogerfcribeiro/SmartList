import { describe, it, expect } from 'vitest';
import { AppError, Errors } from '@/modules/shared/errors';

describe('AppError', () => {
  it('define code, message e statusCode', () => {
    const err = new AppError('MY_CODE', 'Mensagem de erro', 422);
    expect(err.code).toBe('MY_CODE');
    expect(err.message).toBe('Mensagem de erro');
    expect(err.statusCode).toBe(422);
    expect(err.name).toBe('AppError');
    expect(err instanceof Error).toBe(true);
  });

  it('usa statusCode 400 por padrão', () => {
    const err = new AppError('CODE', 'msg');
    expect(err.statusCode).toBe(400);
  });
});

describe('Errors factory', () => {
  it('UNAUTHORIZED retorna 401', () => {
    const err = Errors.UNAUTHORIZED();
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.statusCode).toBe(401);
  });

  it('FORBIDDEN retorna 403', () => {
    const err = Errors.FORBIDDEN();
    expect(err.statusCode).toBe(403);
  });

  it('NOT_FOUND retorna 404 com código baseado no resource', () => {
    const err = Errors.NOT_FOUND('Lista');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('Lista_NOT_FOUND');
  });

  it('CONFLICT usa code e message customizados', () => {
    const err = Errors.CONFLICT('EMAIL_TAKEN', 'Email em uso');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('EMAIL_TAKEN');
    expect(err.message).toBe('Email em uso');
  });

  it('VALIDATION retorna 422', () => {
    const err = Errors.VALIDATION('Dados inválidos');
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('RATE_LIMITED retorna 429', () => {
    const err = Errors.RATE_LIMITED();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMITED');
  });

  it('LIST_LIMIT_REACHED retorna 422', () => {
    const err = Errors.LIST_LIMIT_REACHED();
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('LIST_LIMIT_REACHED');
  });

  it('ITEM_LIMIT_REACHED retorna 422', () => {
    const err = Errors.ITEM_LIMIT_REACHED();
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('ITEM_LIMIT_REACHED');
  });
});
