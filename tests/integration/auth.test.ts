import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { signupUseCase } from '@/modules/auth/use-cases/signup';
import { loginUseCase } from '@/modules/auth/use-cases/login';
import { forgotPasswordUseCase } from '@/modules/auth/use-cases/forgot-password';
import { resetPasswordUseCase } from '@/modules/auth/use-cases/reset-password';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const available = process.env.POSTGRES_AVAILABLE === 'true';

describe.skipIf(!available)('Auth — Integração', () => {
  beforeEach(async () => {
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany();
  });

  // ── signupUseCase ──────────────────────────────────────────────────────────

  describe('signupUseCase', () => {
    it('cria usuário no banco com hash de senha', async () => {
      const result = await signupUseCase({ email: 'novo@test.com', password: 'Senha123' });

      expect(result.email).toBe('novo@test.com');
      expect(result.id).toBeTruthy();

      const dbUser = await prisma.user.findUnique({ where: { id: result.id } });
      expect(dbUser).not.toBeNull();
      expect(dbUser!.passwordHash).toMatch(/^\$2b\$12\$/);
    });

    it('lança EMAIL_ALREADY_EXISTS para email duplicado', async () => {
      await signupUseCase({ email: 'dup@test.com', password: 'Senha123' });

      await expect(signupUseCase({ email: 'dup@test.com', password: 'Outra123' })).rejects.toMatchObject({
        code: 'EMAIL_ALREADY_EXISTS',
        statusCode: 409,
      });
    });

    it('normaliza email para lowercase no banco', async () => {
      await signupUseCase({ email: 'UPPER@TEST.COM', password: 'Senha123' });

      const user = await prisma.user.findUnique({ where: { email: 'upper@test.com' } });
      expect(user).not.toBeNull();
    });
  });

  // ── loginUseCase ───────────────────────────────────────────────────────────

  describe('loginUseCase', () => {
    beforeEach(async () => {
      await signupUseCase({ email: 'login@test.com', password: 'Senha123' });
    });

    it('retorna user com credenciais corretas', async () => {
      const result = await loginUseCase('login@test.com', 'Senha123', '127.0.0.1');
      expect(result.email).toBe('login@test.com');
    });

    it('lança INVALID_CREDENTIALS para senha errada', async () => {
      await expect(loginUseCase('login@test.com', 'Errada123', '127.0.0.1')).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('lança INVALID_CREDENTIALS para email inexistente', async () => {
      await expect(loginUseCase('noexist@test.com', 'Senha123', '127.0.0.1')).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('bloqueia conta após 5 tentativas incorretas', async () => {
      const email = 'login@test.com';
      for (let i = 0; i < 5; i++) {
        await expect(loginUseCase(email, 'Errada123', '127.0.0.1')).rejects.toThrow();
      }

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user!.lockedUntil).not.toBeNull();
      expect(user!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    it('não permite login em conta bloqueada', async () => {
      await prisma.user.updateMany({
        where: { email: 'login@test.com' },
        data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
      });

      await expect(loginUseCase('login@test.com', 'Senha123', '127.0.0.1')).rejects.toMatchObject({
        code: 'ACCOUNT_LOCKED',
      });
    });

    it('reseta failedLoginAttempts após login bem-sucedido', async () => {
      await prisma.user.updateMany({
        where: { email: 'login@test.com' },
        data: { failedLoginAttempts: 3 },
      });

      await loginUseCase('login@test.com', 'Senha123', '127.0.0.1');

      const user = await prisma.user.findUnique({ where: { email: 'login@test.com' } });
      expect(user!.failedLoginAttempts).toBe(0);
    });
  });

  // ── forgotPasswordUseCase ──────────────────────────────────────────────────

  describe('forgotPasswordUseCase', () => {
    beforeEach(async () => {
      await signupUseCase({ email: 'reset@test.com', password: 'Senha123' });
    });

    it('cria token de reset no banco', async () => {
      await forgotPasswordUseCase('reset@test.com');

      const user = await prisma.user.findUnique({ where: { email: 'reset@test.com' } });
      const token = await prisma.passwordResetToken.findFirst({ where: { userId: user!.id } });
      expect(token).not.toBeNull();
      expect(token!.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('substitui token antigo por novo', async () => {
      await forgotPasswordUseCase('reset@test.com');
      await forgotPasswordUseCase('reset@test.com');

      const user = await prisma.user.findUnique({ where: { email: 'reset@test.com' } });
      const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user!.id } });
      expect(tokens).toHaveLength(1);
    });

    it('retorna silenciosamente para email inexistente', async () => {
      await expect(forgotPasswordUseCase('naoexiste@test.com')).resolves.toBeUndefined();
    });
  });

  // ── resetPasswordUseCase ───────────────────────────────────────────────────

  describe('resetPasswordUseCase', () => {
    let userId: string;
    let rawToken: string;

    beforeEach(async () => {
      const user = await signupUseCase({ email: 'redefinir@test.com', password: 'Senha123' });
      userId = user.id;

      rawToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
    });

    it('atualiza senha do usuário no banco', async () => {
      await resetPasswordUseCase(rawToken, 'NovaSenha1');

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const passwordMatches = await bcrypt.compare('NovaSenha1', user!.passwordHash);
      expect(passwordMatches).toBe(true);
    });

    it('marca token como usado após redefinição', async () => {
      await resetPasswordUseCase(rawToken, 'NovaSenha1');

      const token = await prisma.passwordResetToken.findFirst({ where: { userId } });
      expect(token!.usedAt).not.toBeNull();
    });

    it('lança VALIDATION_ERROR para token inválido', async () => {
      await expect(resetPasswordUseCase('token-invalido', 'NovaSenha1')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('lança VALIDATION_ERROR para token já usado', async () => {
      await resetPasswordUseCase(rawToken, 'NovaSenha1');

      await expect(resetPasswordUseCase(rawToken, 'OutraSenha1')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('lança VALIDATION_ERROR para token expirado', async () => {
      await prisma.passwordResetToken.updateMany({
        where: { userId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await expect(resetPasswordUseCase(rawToken, 'NovaSenha1')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });
  });
});
