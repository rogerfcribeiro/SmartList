import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createListSchema,
  updateListSchema,
  createItemSchema,
  updateItemSchema,
} from '@/modules/shared/validators';

describe('emailSchema', () => {
  it('aceita email válido', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true);
  });

  it('converte para lowercase', () => {
    const result = emailSchema.safeParse('USER@EXAMPLE.COM');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('user@example.com');
  });

  it('rejeita email inválido', () => {
    expect(emailSchema.safeParse('invalido').success).toBe(false);
  });

  it('rejeita email sem domínio', () => {
    expect(emailSchema.safeParse('user@').success).toBe(false);
  });

  it('rejeita email maior que 254 chars', () => {
    const long = 'a'.repeat(250) + '@b.com'; // 256 chars total
    expect(emailSchema.safeParse(long).success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('aceita senha válida', () => {
    expect(passwordSchema.safeParse('Senha123').success).toBe(true);
  });

  it('rejeita senha menor que 8 chars', () => {
    const result = passwordSchema.safeParse('Ab1');
    expect(result.success).toBe(false);
  });

  it('rejeita senha sem letras', () => {
    expect(passwordSchema.safeParse('12345678').success).toBe(false);
  });

  it('rejeita senha sem números', () => {
    expect(passwordSchema.safeParse('SenhaForte').success).toBe(false);
  });

  it('rejeita senha maior que 64 chars', () => {
    expect(passwordSchema.safeParse('Ab1' + 'x'.repeat(62)).success).toBe(false);
  });
});

describe('signupSchema', () => {
  it('aceita cadastro completo', () => {
    const result = signupSchema.safeParse({ email: 'user@test.com', password: 'Senha123', name: 'User' });
    expect(result.success).toBe(true);
  });

  it('aceita cadastro sem nome', () => {
    const result = signupSchema.safeParse({ email: 'user@test.com', password: 'Senha123' });
    expect(result.success).toBe(true);
  });

  it('rejeita email inválido', () => {
    expect(signupSchema.safeParse({ email: 'bad', password: 'Senha123' }).success).toBe(false);
  });

  it('rejeita senha fraca', () => {
    expect(signupSchema.safeParse({ email: 'user@test.com', password: 'abc' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('aceita login válido', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: 'qualquer' }).success).toBe(true);
  });

  it('rejeita senha vazia', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: '' }).success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('aceita email válido', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@test.com' }).success).toBe(true);
  });

  it('rejeita email inválido', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('aceita dados válidos', () => {
    const data = { token: 'abc123', password: 'NovaSenha1', confirmPassword: 'NovaSenha1' };
    expect(resetPasswordSchema.safeParse(data).success).toBe(true);
  });

  it('rejeita quando senhas não conferem', () => {
    const data = { token: 'abc123', password: 'NovaSenha1', confirmPassword: 'Diferente1' };
    const result = resetPasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejeita token vazio', () => {
    const data = { token: '', password: 'NovaSenha1', confirmPassword: 'NovaSenha1' };
    expect(resetPasswordSchema.safeParse(data).success).toBe(false);
  });
});

describe('createListSchema', () => {
  it('aceita título válido', () => {
    expect(createListSchema.safeParse({ title: 'Compras' }).success).toBe(true);
  });

  it('rejeita título vazio', () => {
    expect(createListSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('rejeita título maior que 100 chars', () => {
    expect(createListSchema.safeParse({ title: 'a'.repeat(101) }).success).toBe(false);
  });
});

describe('updateListSchema', () => {
  it('aceita título válido', () => {
    expect(updateListSchema.safeParse({ title: 'Nova Lista' }).success).toBe(true);
  });
});

describe('createItemSchema', () => {
  it('aceita item completo', () => {
    const data = { name: 'Arroz', quantity: 2, category: 'HORTIFRUTI' as const };
    expect(createItemSchema.safeParse(data).success).toBe(true);
  });

  it('usa defaults de quantity e category', () => {
    const result = createItemSchema.safeParse({ name: 'Arroz' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
      expect(result.data.category).toBe('OUTROS');
    }
  });

  it('rejeita nome vazio', () => {
    expect(createItemSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejeita nome maior que 120 chars', () => {
    expect(createItemSchema.safeParse({ name: 'a'.repeat(121) }).success).toBe(false);
  });

  it('rejeita quantity zero', () => {
    expect(createItemSchema.safeParse({ name: 'X', quantity: 0 }).success).toBe(false);
  });

  it('rejeita quantity maior que 999', () => {
    expect(createItemSchema.safeParse({ name: 'X', quantity: 1000 }).success).toBe(false);
  });

  it('rejeita categoria inválida', () => {
    expect(createItemSchema.safeParse({ name: 'X', category: 'INVALIDA' }).success).toBe(false);
  });
});

describe('updateItemSchema', () => {
  it('aceita atualização parcial', () => {
    expect(updateItemSchema.safeParse({ checked: true }).success).toBe(true);
    expect(updateItemSchema.safeParse({ name: 'Novo' }).success).toBe(true);
  });

  it('aceita objeto vazio', () => {
    expect(updateItemSchema.safeParse({}).success).toBe(true);
  });

  it('rejeita name vazio', () => {
    expect(updateItemSchema.safeParse({ name: '' }).success).toBe(false);
  });
});
