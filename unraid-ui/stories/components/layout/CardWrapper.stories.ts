import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { CardWrapper as CardWrapperComponent } from '../../../src/components/layout/index.js';

const meta = {
  title: 'Components/Layout/CardWrapper',
  component: CardWrapperComponent,
} satisfies Meta<typeof CardWrapperComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CardWrapper: Story = {
  render: (args) => ({
    components: { CardWrapperComponent },
    setup() {
      return { args };
    },
    template: `
      <CardWrapperComponent v-bind="args">
        <h3 class="text-lg font-semibold mb-2">Card Title</h3>
        <p>This is some example content inside the card wrapper.</p>
      </CardWrapperComponent>
    `,
  }),
};

export const Error: Story = {
  args: {
    error: true,
  },
  render: (args) => ({
    components: { CardWrapperComponent },
    setup() {
      return { args };
    },
    template: `
      <CardWrapperComponent v-bind="args">
        <h3 class="text-lg font-semibold mb-2">Error State</h3>
        <p>This card shows the error state styling.</p>
      </CardWrapperComponent>
    `,
  }),
};

export const Warning: Story = {
  args: {
    warning: true,
  },
  render: (args) => ({
    components: { CardWrapperComponent },
    setup() {
      return { args };
    },
    template: `
      <CardWrapperComponent v-bind="args">
        <h3 class="text-lg font-semibold mb-2">Warning State</h3>
        <p>This card shows the warning state styling.</p>
      </CardWrapperComponent>
    `,
  }),
};
