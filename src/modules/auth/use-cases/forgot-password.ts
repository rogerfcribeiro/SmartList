import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { resetPasswordRateLimit } from '@/lib/rate-limit';

export async function forgotPasswordUseCase(email: string) {
  const { success } = await resetPasswordRateLimit.limit(email);
  if (!success) return; // falha silenciosa — resposta sempre genérica

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // não vaza existência de email

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail({ to: email, name: user.name ?? email, resetUrl });
}
