import { mutationRateLimit } from '@/lib/rate-limit';
import { Errors } from './errors';

export async function checkMutationRateLimit(userId: string) {
  const { success, reset } = await mutationRateLimit.limit(userId);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    const err = Errors.RATE_LIMITED() as Error & { retryAfter?: number };
    err.retryAfter = retryAfter;
    throw err;
  }
}
