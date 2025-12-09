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
  DropdownMenu: {
    name: 'DropdownMenu',
    template: '<div><slot name="trigger" /><slot /></div>',
  },
  Badge: {
    name: 'Badge',
    template: '<div><slot /></div>',
  },
  Button: {
    name: 'Button',
    template: '<button><slot /></button>',
    props: ['variant', 'size'],
  },
  DropdownMenuRoot: {
    name: 'DropdownMenuRoot',
    template: '<div><slot /></div>',
  },
  DropdownMenuTrigger: {
    name: 'DropdownMenuTrigger',
    template: '<div><slot /></div>',
  },
  DropdownMenuContent: {
    name: 'DropdownMenuContent',
    template: '<div><slot /></div>',
  },
  DropdownMenuItem: {
    name: 'DropdownMenuItem',
    template: '<div><slot /></div>',
  },
  DropdownMenuLabel: {
    name: 'DropdownMenuLabel',
    template: '<div><slot /></div>',
  },
  DropdownMenuSeparator: {
    name: 'DropdownMenuSeparator',
    template: '<div />',
  },
  ResponsiveModal: {
    name: 'ResponsiveModal',
    template: '<div><slot /></div>',
    props: ['open'],
  },
  ResponsiveModalHeader: {
    name: 'ResponsiveModalHeader',
    template: '<div><slot /></div>',
  },
  ResponsiveModalFooter: {
    name: 'ResponsiveModalFooter',
    template: '<div><slot /></div>',
  },
  ResponsiveModalTitle: {
    name: 'ResponsiveModalTitle',
    template: '<div><slot /></div>',
  },
  isDarkModeActive: vi.fn(() => {
    if (typeof document === 'undefined') return false;
    const cssVar = getComputedStyle(document.documentElement)
      .getPropertyValue('--theme-dark-mode')
      .trim();
    if (cssVar === '1') return true;
    if (cssVar === '0') return false;
    if (document.documentElement.classList.contains('dark')) return true;
    if (document.body?.classList.contains('dark')) return true;
    if (document.querySelector('.unapi.dark')) return true;
    return false;
  }),
  // Add other UI components as needed
}));
