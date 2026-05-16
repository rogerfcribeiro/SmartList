import { vi } from 'vitest';

// Mock Upstash Redis — integration tests use real DB but not external services
vi.mock('@/lib/rate-limit', () => ({
  loginRateLimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
  mutationRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, reset: Date.now() + 60_000 }) },
  resetPasswordRateLimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));

// Mock email — never send real emails in tests
vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));
