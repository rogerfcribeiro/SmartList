export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  UNAUTHORIZED:       () => new AppError('UNAUTHORIZED', 'Não autenticado', 401),
  FORBIDDEN:          () => new AppError('FORBIDDEN', 'Acesso negado', 403),
  NOT_FOUND:          (resource: string) => new AppError(`${resource}_NOT_FOUND`, `${resource} não encontrado`, 404),
  CONFLICT:           (code: string, msg: string) => new AppError(code, msg, 409),
  VALIDATION:         (msg: string) => new AppError('VALIDATION_ERROR', msg, 422),
  RATE_LIMITED:       () => new AppError('RATE_LIMITED', 'Muitas requisições. Tente novamente em breve.', 429),
  LIST_LIMIT_REACHED: () => new AppError('LIST_LIMIT_REACHED', 'Limite de listas atingido. Exclua uma para criar nova.', 422),
  ITEM_LIMIT_REACHED: () => new AppError('ITEM_LIMIT_REACHED', 'Lista cheia (200 itens).', 422),
};
