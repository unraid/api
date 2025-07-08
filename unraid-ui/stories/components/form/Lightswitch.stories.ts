import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Lightswitch as LightswitchComponent } from '../../../src/components/form/lightswitch/index.js';

const meta = {
  title: 'Components/Form/Lightswitch',
  component: LightswitchComponent,
} satisfies Meta<typeof LightswitchComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Lightswitch: Story = {
  args: {
    label: 'Enable notifications',
  },
  render: (args) => ({
    components: { LightswitchComponent },
    setup() {
      return { args };
    },
    template: `
      <LightswitchComponent v-bind="args" />
    `,
  }),
};
