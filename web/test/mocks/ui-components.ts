import { vi } from 'vitest';

// Mock @unraid/ui components
vi.mock('@unraid/ui', () => ({
  BrandButton: {
    name: 'BrandButton',
    template: '<button><slot /></button>',
  },
  // Add other UI components as needed
}));
