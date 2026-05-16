import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUserFindUnique = vi.fn();
const mockUserCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
    compare: vi.fn(),
  },
}));

const { signupUseCase } = await import('@/modules/auth/use-cases/signup');

const validInput = { email: 'user@example.com', password: 'Senha123' };

describe('signupUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria usuário e retorna dados sem senha', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: 'user-1', email: 'user@example.com', name: null });

    const result = await signupUseCase(validInput);

    expect(result).toEqual({ id: 'user-1', email: 'user@example.com', name: null });
    expect(mockUserCreate).toHaveBeenCalledWith({
      data: {
        email: 'user@example.com',
        passwordHash: '$2b$12$hashedpassword',
        name: null,
      },
      select: { id: true, email: true, name: true },
    });
  });

  it('salva nome quando fornecido', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: 'u1', email: 'u@t.com', name: 'Fulano' });

    await signupUseCase({ ...validInput, name: 'Fulano' });

    const createArgs = mockUserCreate.mock.calls[0][0];
    expect(createArgs.data.name).toBe('Fulano');
  });

  it('normaliza email para lowercase', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: 'u1', email: 'user@example.com', name: null });

    await signupUseCase({ email: 'USER@EXAMPLE.COM', password: 'Senha123' });

    expect(mockUserFindUnique).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
  });

  it('lança EMAIL_ALREADY_EXISTS quando email já está em uso', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'existente', email: 'user@example.com' });

    await expect(signupUseCase(validInput)).rejects.toMatchObject({
      code: 'EMAIL_ALREADY_EXISTS',
      statusCode: 409,
    });
  });

  it('não cria usuário quando email duplicado', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'existente' });

    await expect(signupUseCase(validInput)).rejects.toThrow();
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it('lança erro de validação para email inválido', async () => {
    await expect(signupUseCase({ email: 'invalido', password: 'Senha123' })).rejects.toThrow();
  });

  it('lança erro de validação para senha fraca', async () => {
    await expect(signupUseCase({ email: 'user@test.com', password: 'abc' })).rejects.toThrow();
  });
});
