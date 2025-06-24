import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Input as InputComponent } from '../../../src/components/form/input';

const meta = {
  title: 'Components/Form/Input',
  component: InputComponent,
} satisfies Meta<typeof InputComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Input: Story = {
  render: (args) => ({
    components: { InputComponent },
    setup() {
      return { args };
    },
    template: `
      <InputComponent placeholder="Type something..." v-bind="args" />
    `,
  }),
};
