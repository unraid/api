import type { Meta, StoryObj } from '@storybook/vue3';
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
      options: ['sm', 'md', 'lg'],
    },
    title: { control: 'text' },
  },
} satisfies Meta<typeof BrandLoadingCe>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = {
  variant: 'default' as const,
  title: 'Loading',
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
