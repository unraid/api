import type { Meta, StoryObj } from "@storybook/vue3";
import BrandLoading from "../../../src/components/brand/BrandLoading.ce.vue";

const meta = {
  title: "Components/Brand",
  component: BrandLoading,
  argTypes: {
    gradientStart: { control: 'color' },
    gradientStop: { control: 'color' },
    title: { control: 'text' },
  },
} satisfies Meta<typeof BrandLoading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    gradientStart: '#e32929',
    gradientStop: '#ff8d30',
    title: 'Loading',
  },
  render: (args) => ({
    components: { BrandLoading },
    setup() {
      return { args };
    },
    template: `
      <div class="w-[200px]">
        <BrandLoading
          :gradient-start="args.gradientStart"
          :gradient-stop="args.gradientStop"
          :title="args.title"
        />
      </div>
    `,
  }),
}; 
