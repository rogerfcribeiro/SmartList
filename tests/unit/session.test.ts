import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '@/modules/shared/errors';

const mockAuth = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

// Import after mock
const { requireSession } = await import('@/modules/shared/session');

describe('requireSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna user quando sessão existe', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', name: 'User' },
    });

    const user = await requireSession();

    expect(user.id).toBe('user-1');
    expect(user.email).toBe('user@test.com');
  });

  it('lança UNAUTHORIZED quando não há sessão', async () => {
    mockAuth.mockResolvedValue(null);

    await expect(requireSession()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });

  it('lança UNAUTHORIZED quando user.id está ausente', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'user@test.com' } });

    await expect(requireSession()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('lança AppError', async () => {
    mockAuth.mockResolvedValue(null);

    await expect(requireSession()).rejects.toBeInstanceOf(AppError);
  });
});
