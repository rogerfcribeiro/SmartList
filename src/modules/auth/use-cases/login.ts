import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginRateLimit } from '@/lib/rate-limit';
import { Errors } from '@/modules/shared/errors';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const GENERIC_ERROR_MSG = 'Email ou senha incorretos.';

export async function loginUseCase(email: string, password: string, ip: string) {
  const key = `${ip}:${email}`;
  const { success } = await loginRateLimit.limit(key);
  if (!success) throw Errors.RATE_LIMITED();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw Errors.CONFLICT('INVALID_CREDENTIALS', GENERIC_ERROR_MSG);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw Errors.CONFLICT('ACCOUNT_LOCKED', 'Muitas tentativas. Tente novamente em 15 minutos.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= MAX_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
      },
    });

    throw Errors.CONFLICT('INVALID_CREDENTIALS', GENERIC_ERROR_MSG);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  return { id: user.id, email: user.email, name: user.name };
}
