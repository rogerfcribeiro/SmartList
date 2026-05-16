import { auth } from '@/lib/auth';
import { Errors } from './errors';

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw Errors.UNAUTHORIZED();
  return session.user as { id: string; email: string; name?: string | null };
}
