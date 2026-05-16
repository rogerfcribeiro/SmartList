import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/modules/shared/validators';
import { Errors } from '@/modules/shared/errors';
import { z } from 'zod';

type SignupInput = z.infer<typeof signupSchema>;

export async function signupUseCase(input: SignupInput) {
  const data = signupSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw Errors.CONFLICT(
      'EMAIL_ALREADY_EXISTS',
      'Este email já está cadastrado. Faça login ou recupere sua senha.',
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name ?? null,
    },
    select: { id: true, email: true, name: true },
  });

  return user;
}
