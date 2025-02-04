import type { Meta, StoryObj } from '@storybook/vue3';
import BrandLoadingCe from '../../../src/components/brand/BrandLoading.ce.vue';
import BrandLoadingVue from '../../../src/components/brand/BrandLoading.ce.vue';

const meta = {
  title: 'Components/Brand',
  component: BrandLoadingCe,
  argTypes: {
    gradientStart: { control: 'color' },
    gradientStop: { control: 'color' },
    title: { control: 'text' },
  },
} satisfies Meta<typeof BrandLoadingCe>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = {
  gradientStart: '#e32929',
  gradientStop: '#ff8d30',
  title: 'Loading',
};

// Vue Component version
export const Loading: Story = {
  args: defaultArgs,
  render: (args) => ({
    components: { BrandLoadingVue },
    setup() {
      return { args };
    },
    template: `
      <div>
        <div class="w-[200px]">
          <BrandLoadingVue
            :gradient-start="args.gradientStart"
            :gradient-stop="args.gradientStop"
            :title="args.title"
          />
        </div>
      </div>
    `,
  }),
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
            :gradient-start="args.gradientStart"
            :gradient-stop="args.gradientStop"
            :title="args.title"
          />
        </div>
      </div>
    `,
  }),
};
