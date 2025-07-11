import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { BrandLogoConnect } from '../../../src/components/brand/index.js';

const meta = {
  title: 'Components/Brand',
  component: BrandLogoConnect,
  argTypes: {
    gradientStart: { control: 'color' },
    gradientStop: { control: 'color' },
  },
} satisfies Meta<typeof BrandLogoConnect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LogoConnect: Story = {
  args: {
    gradientStart: '#e32929',
    gradientStop: '#ff8d30',
  },
  render: (args) => ({
    components: { BrandLogoConnect },
    setup() {
      return { args };
    },
    template: `
      <div class="w-[300px]">
        <BrandLogoConnect
          :gradient-start="args.gradientStart"
          :gradient-stop="args.gradientStop"
        />
      </div>
    `,
  }),
};
