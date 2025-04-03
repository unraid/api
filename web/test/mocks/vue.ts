import { vi } from 'vitest';

// Mock Vue composition API
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    ref: vi.fn((x) => ({ value: x })),
    computed: vi.fn((fn) => {
      // Safely handle computed functions
      if (typeof fn === 'function') {
        try {
          return { value: fn() };
        } catch {
          // Silently handle errors in computed functions
          return { value: undefined };
        }
      }
      return { value: fn };
    }),
    reactive: vi.fn((x) => x),
    watch: vi.fn(),
    onMounted: vi.fn((fn) => (typeof fn === 'function' ? fn() : undefined)),
    onUnmounted: vi.fn(),
    nextTick: vi.fn(() => Promise.resolve()),
  };
});
