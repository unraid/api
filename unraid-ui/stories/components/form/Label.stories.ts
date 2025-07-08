import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Label as LabelComponent } from '../../../src/components/form/label/index.js';

const meta = {
  title: 'Components/Form',
  component: LabelComponent,
} satisfies Meta<typeof LabelComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Label: Story = {
  render: (args) => ({
    components: { LabelComponent },
    setup() {
      return { args };
    },
    template: `
      <LabelComponent>Email address</LabelComponent>
    `,
  }),
};
