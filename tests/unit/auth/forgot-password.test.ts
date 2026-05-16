import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUserFindUnique = vi.fn();
const mockTokenDeleteMany = vi.fn();
const mockTokenCreate = vi.fn();
const mockResetLimit = vi.fn();
const mockSendEmail = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    passwordResetToken: {
      deleteMany: mockTokenDeleteMany,
      create: mockTokenCreate,
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  loginRateLimit: { limit: vi.fn() },
  mutationRateLimit: { limit: vi.fn() },
  resetPasswordRateLimit: { limit: mockResetLimit },
}));

vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: mockSendEmail,
}));

const { forgotPasswordUseCase } = await import('@/modules/auth/use-cases/forgot-password');

const testUser = { id: 'user-1', email: 'user@example.com', name: 'User' };

describe('forgotPasswordUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResetLimit.mockResolvedValue({ success: true });
    mockTokenDeleteMany.mockResolvedValue({ count: 0 });
    mockTokenCreate.mockResolvedValue({});
    mockSendEmail.mockResolvedValue(undefined);
  });

  it('cria token e envia email quando usuário existe', async () => {
    mockUserFindUnique.mockResolvedValue(testUser);

    await forgotPasswordUseCase('user@example.com');

    expect(mockTokenDeleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(mockTokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        resetUrl: expect.stringContaining('/reset-password?token='),
      }),
    );
  });

  it('retorna silenciosamente quando usuário não existe', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await expect(forgotPasswordUseCase('naoexiste@test.com')).resolves.toBeUndefined();

    expect(mockTokenCreate).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('retorna silenciosamente quando rate limit excedido', async () => {
    mockResetLimit.mockResolvedValue({ success: false });

    await expect(forgotPasswordUseCase('user@example.com')).resolves.toBeUndefined();

    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('deleta tokens antigos antes de criar novo', async () => {
    mockUserFindUnique.mockResolvedValue(testUser);

    await forgotPasswordUseCase('user@example.com');

    const calls = vi.mocked(mockTokenDeleteMany).mock.invocationCallOrder[0];
    const createCall = vi.mocked(mockTokenCreate).mock.invocationCallOrder[0];
    expect(calls).toBeLessThan(createCall);
  });

  it('armazena hash do token, não o token em claro', async () => {
    mockUserFindUnique.mockResolvedValue(testUser);

    await forgotPasswordUseCase('user@example.com');

    const createArgs = mockTokenCreate.mock.calls[0][0];
    // tokenHash deve ser hexadecimal de 64 chars (SHA-256)
    expect(createArgs.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('token expira em 30 minutos', async () => {
    mockUserFindUnique.mockResolvedValue(testUser);
    const before = Date.now();

    await forgotPasswordUseCase('user@example.com');

    const createArgs = mockTokenCreate.mock.calls[0][0];
    const expiresAt: Date = createArgs.data.expiresAt;
    const diffMs = expiresAt.getTime() - before;
    // Deve ser aproximadamente 30 minutos (com margem de 5s)
    expect(diffMs).toBeGreaterThan(29 * 60 * 1000);
    expect(diffMs).toBeLessThan(31 * 60 * 1000);
  });
});
