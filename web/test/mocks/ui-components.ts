import { vi } from 'vitest';

// Mock @unraid/ui components and functions
const mockCn = (...args: any[]) => args.filter(Boolean).join(' ');

const MockBrandButton = {
  name: 'BrandButton',
  props: [
    'class',
    'disabled',
    'external',
    'href',
    'icon',
    'iconRight',
    'iconRightHoverDisplay',
    'text',
    'title',
  ],
  template: `
    <button 
      :class="props.class" 
      :disabled="props.disabled" 
      :href="props.href"
      :external="props.external"
      :title="props.title"
    >
      {{ props.text || '' }} <slot />
    </button>
  `,
  setup(props: Record<string, unknown>) {
    return { props };
  },
};

vi.mock('@unraid/ui', () => ({
  cn: mockCn,
  BrandButton: MockBrandButton,
  // Add other UI components as needed
}));
