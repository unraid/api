import { vi } from 'vitest';

// Mock @unraid/ui components and functions
const mockCn = (...args: unknown[]) => args.filter(Boolean).join(' ');

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
    'download',
  ],
  template: `
    <component :is="props.href ? 'a' : 'button'"
      :class="props.class" 
      :disabled="props.disabled" 
      :href="props.href"
      :target="props.external ? '_blank' : undefined"
      :rel="props.external ? 'noopener noreferrer' : undefined"
      :title="props.title"
      :download="props.download"
    >
      <span v-if="props.icon" class="icon">{{ props.icon }}</span>
      {{ props.text || '' }} <slot />
      <span v-if="props.iconRight" class="icon-right" :class="{ 'hover-only': props.iconRightHoverDisplay }">{{ props.iconRight }}</span>
    </component>
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
