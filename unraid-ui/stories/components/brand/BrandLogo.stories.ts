import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { BrandLogo } from '../../../src/components/brand/index.js';

const meta = {
  title: 'Components/Brand',
  component: BrandLogo,
  argTypes: {
    gradientStart: { control: 'color' },
    gradientStop: { control: 'color' },
  },
} satisfies Meta<typeof BrandLogo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Logo: Story = {
  args: {
    gradientStart: '#e32929',
    gradientStop: '#ff8d30',
  },
  render: (args) => ({
    components: { BrandLogo },
    setup() {
      return { args };
    },
    template: `
      <div class="w-[300px]">
        <BrandLogo
          :gradient-start="args.gradientStart"
          :gradient-stop="args.gradientStop"
        />
      </div>
    `,
  }),
};
