import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ButtonComponent from '../../../src/components/common/button/Button.vue';

const meta = {
  title: 'Components/Common',
  component: ButtonComponent,
} satisfies Meta<typeof ButtonComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    default: 'Click me',
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
