import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Label } from '../../../src/components/form/label';
import { Switch as SwitchComponent } from '../../../src/components/form/switch';

const meta = {
  title: 'Components/Form',
  component: SwitchComponent,
} satisfies Meta<typeof SwitchComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Switch: Story = {
  render: (args) => ({
    components: { SwitchComponent, Label },
    setup() {
      return { args };
    },
    template: `
      <div class="flex items-center space-x-2">
        <SwitchComponent v-bind="args" />
        <Label>Airplane Mode</Label>
      </div>
    `,
  }),
};
