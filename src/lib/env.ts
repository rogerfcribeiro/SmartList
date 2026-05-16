import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  PASSWORD_RESET_SECRET: z.string().min(32),
  EMAIL_FROM: z.string().email(),
  RESEND_API_KEY: z.string().startsWith('re_'),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
