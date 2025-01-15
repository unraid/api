import type { Meta, StoryObj } from "@storybook/vue3";
import BadgeComponent from "../../../src/components/common/badge/Badge.vue";

const meta = {
  title: "Components/Common",
  component: BadgeComponent,
} satisfies Meta<typeof BadgeComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Badge: Story = {
  args: {
    variant: "gray",
    size: "md",
    default: "Badge",
    class: ""
  },
  render: (args) => ({
    components: { BadgeComponent },
    setup() {
      return { args };
    },
    template: `
      <BadgeComponent 
        :variant="args.variant" 
        :size="args.size"
        :class="args.class"
      >
        {{ args.default }}
      </BadgeComponent>
    `,
  }),
}; 