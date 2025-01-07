import type { Meta, StoryObj } from "@storybook/vue3";
import BrandLoadingWhite from "../../../src/components/brand/BrandLoadingWhite.vue";

const meta = {
  title: "Components/Brand",
  component: BrandLoadingWhite,
  decorators: [
    () => ({
      template: '<div class="bg-black p-8 rounded-md"><story/></div>',
    }),
  ],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
} satisfies Meta<typeof BrandLoadingWhite>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoadingWhite: Story = {
  render: () => ({
    components: { BrandLoadingWhite },
    template: `
      <div class="w-[200px]">
        <BrandLoadingWhite />
      </div>
    `,
  }),
}; 
