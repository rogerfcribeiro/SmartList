import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTokenFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockTokenUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: { findUnique: mockTokenFindUnique, update: mockTokenUpdate },
    user: { update: mockUserUpdate },
    $transaction: mockTransaction,
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$novohashedpassword'),
    compare: vi.fn(),
  },
}));

const { resetPasswordUseCase } = await import('@/modules/auth/use-cases/reset-password');

const validToken = {
  id: 'token-1',
  userId: 'user-1',
  tokenHash: 'irrelevant-in-test',
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  usedAt: null,
};

describe('resetPasswordUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserUpdate.mockResolvedValue({});
    mockTokenUpdate.mockResolvedValue({});
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it('atualiza senha e marca token como usado', async () => {
    mockTokenFindUnique.mockResolvedValue(validToken);

    await resetPasswordUseCase('raw-token', 'NovaSenha1');

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordHash: '$2b$12$novohashedpassword',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    expect(mockTokenUpdate).toHaveBeenCalledWith({
      where: { id: 'token-1' },
      data: { usedAt: expect.any(Date) },
    });
  });

  it('lança VALIDATION_ERROR quando token não existe', async () => {
    mockTokenFindUnique.mockResolvedValue(null);

    await expect(resetPasswordUseCase('invalido', 'NovaSenha1')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });

  it('lança VALIDATION_ERROR quando token expirou', async () => {
    mockTokenFindUnique.mockResolvedValue({
      ...validToken,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(resetPasswordUseCase('expirado', 'NovaSenha1')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('lança VALIDATION_ERROR quando token já foi usado', async () => {
    mockTokenFindUnique.mockResolvedValue({
      ...validToken,
      usedAt: new Date(),
    });

    await expect(resetPasswordUseCase('usado', 'NovaSenha1')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('busca token pelo SHA-256 do rawToken', async () => {
    mockTokenFindUnique.mockResolvedValue(validToken);

    await resetPasswordUseCase('meu-raw-token', 'NovaSenha1');

    const findArgs = mockTokenFindUnique.mock.calls[0][0];
    // tokenHash deve ser SHA-256 hex de 64 chars
    expect(findArgs.where.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('reseta failedLoginAttempts e lockedUntil ao redefinir senha', async () => {
    mockTokenFindUnique.mockResolvedValue(validToken);

    await resetPasswordUseCase('raw-token', 'NovaSenha1');

    const userUpdateArgs = mockUserUpdate.mock.calls[0][0];
    expect(userUpdateArgs.data.failedLoginAttempts).toBe(0);
    expect(userUpdateArgs.data.lockedUntil).toBeNull();
  });
});
