import type { Meta, StoryObj } from "@storybook/vue3";
import ButtonComponent from "../../../src/components/common/button/Button.vue";

const meta = {
  title: "Components/Common",
  component: ButtonComponent,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description: "Style variant of the button",
      control: "select",
      defaultValue: "primary",
    },
    size: {
      description: "Size of the button",
      control: "select",
      defaultValue: "md",
    },
    class: {
      description: "Additional CSS classes",
      control: "text",
    },
    default: {
      description: "Button content (slot)",
      control: "text",
    },
  },
} satisfies Meta<typeof ButtonComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    variant: "primary",
    size: "md",
    default: "Click me",
  },
  render: (args) => ({
    components: { ButtonComponent },
    setup() {
      return { args };
    },
    template: `
      <ButtonComponent
        :variant="args.variant"
        :size="args.size"
        :class="args.class"
      >
        {{ args.default }}
      </ButtonComponent>
    `,
  }),
};
