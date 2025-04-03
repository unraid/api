import { vi } from 'vitest';

// Mock clsx
vi.mock('clsx', () => {
  const clsx = (...args: unknown[]) => {
    return args
      .flatMap((arg) => {
        if (typeof arg === 'string') return arg;
        if (Array.isArray(arg)) return arg.filter(Boolean);
        if (typeof arg === 'object' && arg !== null) {
          return Object.entries(arg)
            .filter(([, value]) => Boolean(value))
            .map(([key]) => key);
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  };

  return { default: clsx };
});

// Mock tailwind-merge
vi.mock('tailwind-merge', () => {
  const twMerge = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
  };

  return {
    twMerge,
    twJoin: twMerge,
    createTailwindMerge: () => twMerge,
    getDefaultConfig: () => ({}),
    fromTheme: () => () => '',
  };
});
