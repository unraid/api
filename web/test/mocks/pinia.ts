import { vi } from 'vitest';

// Mock Pinia
vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia');
  return {
    ...actual,
    defineStore: vi.fn((id, setup) => {
      const setupFn = typeof setup === 'function' ? setup : setup.setup;
      return vi.fn(() => {
        try {
          const store = setupFn();
          return {
            ...store,
            $reset: vi.fn(),
            $patch: vi.fn(),
          };
        } catch (e) {
          console.error(`Error creating store ${id}:`, e);
          return {
            $reset: vi.fn(),
            $patch: vi.fn(),
          };
        }
      });
    }),
    storeToRefs: vi.fn((store) => store || {}),
  };
});
