import type { Meta, StoryObj } from '@storybook/vue3-vite';
import BrandLoadingCe from '../../../src/components/brand/BrandLoading.ce.vue';

const meta = {
  title: 'Components/Brand',
  component: BrandLoadingCe,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'black', 'white'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'full'],
    },
    title: { control: 'text' },
  },
} satisfies Meta<typeof BrandLoadingCe>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = {
  variant: 'default' as const,
  title: 'Loading',
  size: 'full' as const,
};

// Web Component version
export const LoadingCE: Story = {
  args: defaultArgs,
  render: (args) => ({
    setup() {
      return { args };
    },
    template: `
      <div>
        <div class="w-[200px]">
          <uui-brand-loading
            :variant="args.variant"
            :size="args.size"
            :title="args.title"
          />
        </div>
      </div>
    `,
  }),
};
