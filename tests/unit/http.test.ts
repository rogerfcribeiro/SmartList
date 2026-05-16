import { describe, it, expect } from 'vitest';
import { AppError } from '@/modules/shared/errors';
import { apiSuccess, apiError } from '@/modules/shared/http';

describe('apiSuccess', () => {
  it('retorna 200 com data por padrão', async () => {
    const res = apiSuccess({ id: '1', name: 'test' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ id: '1', name: 'test' });
  });

  it('retorna status customizado', async () => {
    const res = apiSuccess({ ok: true }, 201);
    expect(res.status).toBe(201);
  });

  it('serializa array corretamente', async () => {
    const res = apiSuccess([{ id: '1' }, { id: '2' }]);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });
});

describe('apiError', () => {
  it('formata AppError corretamente', async () => {
    const error = new AppError('TEST_CODE', 'Mensagem de teste', 422);
    const res = apiError(error);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data).toEqual({ error: { code: 'TEST_CODE', message: 'Mensagem de teste' } });
  });

  it('inclui Retry-After quando AppError tem retryAfter', async () => {
    const error = new AppError('RATE_LIMITED', 'Muitas requisições', 429) as AppError & { retryAfter: number };
    error.retryAfter = 30;
    const res = apiError(error);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('retorna 500 para erros desconhecidos', async () => {
    const res = apiError(new Error('erro interno qualquer'));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });

  it('retorna 500 para valores não-Error', async () => {
    const res = apiError('string qualquer');
    expect(res.status).toBe(500);
  });
});
