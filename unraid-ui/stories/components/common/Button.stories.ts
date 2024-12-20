import type { Meta, StoryObj } from "@storybook/vue3";
import ButtonComponent from "../../../src/components/common/button/Button.vue";

interface ButtonStoryProps {
  variant:
    | "primary"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size: "sm" | "md" | "lg" | "icon";
  text: string;
}

const meta = {
  title: "Components/Common",
  component: ButtonComponent,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
    },
  },
} satisfies Meta<typeof ButtonComponent>;

export default meta;

type Story = StoryObj<ButtonStoryProps>;

export const Button: Story = {
  args: {
    variant: "primary",
    size: "md",
    text: "Click me",
  },
  render: (args) => ({
    components: { ButtonComponent },
    setup() {
      return { args };
    },
    template:
      '<ButtonComponent :variant="args.variant" :size="args.size">{{ args.text }}</ButtonComponent>',
  }),
};
