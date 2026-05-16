import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockLoginLimit = vi.fn();
const mockBcryptCompare = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  loginRateLimit: { limit: mockLoginLimit },
  mutationRateLimit: { limit: vi.fn() },
  resetPasswordRateLimit: { limit: vi.fn() },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: mockBcryptCompare,
  },
}));

const { loginUseCase } = await import('@/modules/auth/use-cases/login');

const baseUser = {
  id: 'user-1',
  email: 'user@example.com',
  passwordHash: '$2b$12$hash',
  name: 'User',
  failedLoginAttempts: 0,
  lockedUntil: null,
};

describe('loginUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginLimit.mockResolvedValue({ success: true });
  });

  it('retorna user quando credenciais corretas', async () => {
    mockUserFindUnique.mockResolvedValue(baseUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockUserUpdate.mockResolvedValue(baseUser);

    const result = await loginUseCase('user@example.com', 'Senha123', '127.0.0.1');

    expect(result).toEqual({ id: 'user-1', email: 'user@example.com', name: 'User' });
  });

  it('reseta failedLoginAttempts após login bem-sucedido', async () => {
    mockUserFindUnique.mockResolvedValue({ ...baseUser, failedLoginAttempts: 3 });
    mockBcryptCompare.mockResolvedValue(true);
    mockUserUpdate.mockResolvedValue(baseUser);

    await loginUseCase('user@example.com', 'Senha123', '127.0.0.1');

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });

  it('lança erro genérico quando usuário não existe', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await expect(loginUseCase('naoexiste@test.com', 'Senha123', '127.0.0.1')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 409,
    });
  });

  it('lança erro genérico para senha errada', async () => {
    mockUserFindUnique.mockResolvedValue(baseUser);
    mockBcryptCompare.mockResolvedValue(false);
    mockUserUpdate.mockResolvedValue(baseUser);

    await expect(loginUseCase('user@example.com', 'SenhaErrada1', '127.0.0.1')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('incrementa failedLoginAttempts após senha errada', async () => {
    mockUserFindUnique.mockResolvedValue({ ...baseUser, failedLoginAttempts: 2 });
    mockBcryptCompare.mockResolvedValue(false);
    mockUserUpdate.mockResolvedValue(baseUser);

    await expect(loginUseCase('user@example.com', 'Errada1', '127.0.0.1')).rejects.toThrow();

    const updateArgs = mockUserUpdate.mock.calls[0][0];
    expect(updateArgs.data.failedLoginAttempts).toBe(3);
  });

  it('bloqueia conta após 5 tentativas falhas', async () => {
    mockUserFindUnique.mockResolvedValue({ ...baseUser, failedLoginAttempts: 4 });
    mockBcryptCompare.mockResolvedValue(false);
    mockUserUpdate.mockResolvedValue(baseUser);

    await expect(loginUseCase('user@example.com', 'Errada1', '127.0.0.1')).rejects.toThrow();

    const updateArgs = mockUserUpdate.mock.calls[0][0];
    expect(updateArgs.data.lockedUntil).toBeInstanceOf(Date);
    expect(updateArgs.data.failedLoginAttempts).toBe(5);
  });

  it('lança ACCOUNT_LOCKED quando conta está bloqueada', async () => {
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    mockUserFindUnique.mockResolvedValue({ ...baseUser, lockedUntil });
    mockBcryptCompare.mockResolvedValue(true);

    await expect(loginUseCase('user@example.com', 'Senha123', '127.0.0.1')).rejects.toMatchObject({
      code: 'ACCOUNT_LOCKED',
      statusCode: 409,
    });
  });

  it('lança RATE_LIMITED quando limite excedido', async () => {
    mockLoginLimit.mockResolvedValue({ success: false });

    await expect(loginUseCase('user@example.com', 'Senha123', '127.0.0.1')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      statusCode: 429,
    });
  });

  it('usa IP+email como chave do rate limit', async () => {
    mockLoginLimit.mockResolvedValue({ success: true });
    mockUserFindUnique.mockResolvedValue(null);

    await expect(loginUseCase('user@example.com', 'Senha', '192.168.1.1')).rejects.toThrow();

    expect(mockLoginLimit).toHaveBeenCalledWith('192.168.1.1:user@example.com');
  });

  it('não verifica senha de conta com lockedUntil expirado', async () => {
    const pastDate = new Date(Date.now() - 1000);
    mockUserFindUnique.mockResolvedValue({ ...baseUser, lockedUntil: pastDate });
    mockBcryptCompare.mockResolvedValue(true);
    mockUserUpdate.mockResolvedValue(baseUser);

    const result = await loginUseCase('user@example.com', 'Senha123', '127.0.0.1');
    expect(result.id).toBe('user-1');
  });
});
