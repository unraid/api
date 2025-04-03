import { vi } from 'vitest';

// Mock specific problematic stores
vi.mock('~/store/errors', () => {
  const useErrorsStore = vi.fn(() => ({
    errors: { value: [] },
    addError: vi.fn(),
    clearErrors: vi.fn(),
    removeError: vi.fn(),
  }));

  return { useErrorsStore };
});
