import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Email inválido')
  .toLowerCase()
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter ao menos 8 caracteres')
  .max(64, 'Senha deve ter no máximo 64 caracteres')
  .regex(/[a-zA-Z]/, 'Senha deve conter ao menos uma letra')
  .regex(/[0-9]/, 'Senha deve conter ao menos um número');

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().max(60).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha obrigatória'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  });

export const createListSchema = z.object({
  title: z.string().min(1, 'Nome obrigatório').max(100),
});

export const updateListSchema = z.object({
  title: z.string().min(1, 'Nome obrigatório').max(100),
});

export const createItemSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120),
  quantity: z.number().int().min(1).max(999).default(1),
  category: z
    .enum(['HORTIFRUTI', 'ACOUGUE', 'PADARIA', 'LIMPEZA', 'HIGIENE', 'BEBIDAS', 'OUTROS'])
    .default('OUTROS'),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  quantity: z.number().int().min(1).max(999).optional(),
  category: z
    .enum(['HORTIFRUTI', 'ACOUGUE', 'PADARIA', 'LIMPEZA', 'HIGIENE', 'BEBIDAS', 'OUTROS'])
    .optional(),
  checked: z.boolean().optional(),
});
