import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '@/modules/shared/errors';

const mockMutationLimit = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  mutationRateLimit: { limit: mockMutationLimit },
  loginRateLimit: { limit: vi.fn() },
  resetPasswordRateLimit: { limit: vi.fn() },
}));

const { checkMutationRateLimit } = await import('@/modules/shared/with-rate-limit');

describe('checkMutationRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolve sem lançar quando rate limit OK', async () => {
    mockMutationLimit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
    await expect(checkMutationRateLimit('user-1')).resolves.toBeUndefined();
  });

  it('lança RATE_LIMITED quando limite excedido', async () => {
    const reset = Date.now() + 30_000;
    mockMutationLimit.mockResolvedValue({ success: false, reset });

    await expect(checkMutationRateLimit('user-1')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      statusCode: 429,
    });
  });

  it('lança AppError quando rate limited', async () => {
    mockMutationLimit.mockResolvedValue({ success: false, reset: Date.now() + 60_000 });
    await expect(checkMutationRateLimit('user-1')).rejects.toBeInstanceOf(AppError);
  });

  it('inclui retryAfter no erro', async () => {
    const reset = Date.now() + 30_000;
    mockMutationLimit.mockResolvedValue({ success: false, reset });

    try {
      await checkMutationRateLimit('user-1');
    } catch (error) {
      const err = error as AppError & { retryAfter?: number };
      expect(typeof err.retryAfter).toBe('number');
      expect(err.retryAfter).toBeGreaterThan(0);
    }
  });

  it('chama o limiter com o userId correto', async () => {
    mockMutationLimit.mockResolvedValue({ success: true, reset: 0 });
    await checkMutationRateLimit('user-42');
    expect(mockMutationLimit).toHaveBeenCalledWith('user-42');
  });
});
