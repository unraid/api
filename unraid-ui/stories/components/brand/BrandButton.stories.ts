import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { BrandButton } from '../../../src/components/brand/index.js';

const meta = {
  title: 'Components/Brand',
  component: BrandButton,
} satisfies Meta<typeof BrandButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    variant: 'fill',
    size: '14px',
    padding: 'default',
    text: 'Click me',
  },
  render: (args) => ({
    components: { BrandButton },
    setup() {
      return { args };
    },
    template: `
      <BrandButton
        :variant="args.variant"
        :size="args.size"
        :padding="args.padding"
        :text="args.text"
        :class="args.class"
      />
    `,
  }),
};
