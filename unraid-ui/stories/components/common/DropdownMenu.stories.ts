import { DropdownMenu } from '@/components/common/dropdown';
import type { Meta, StoryObj } from '@storybook/vue3';

const meta = {
  title: 'Components/Common/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end'],
    },
    side: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left'],
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

// Basic props-based usage
export const BasicUsage: Story = {
  args: {
    trigger: 'Options',
    items: [{ label: 'Profile' }, { label: 'Settings' }, { type: 'separator' }, { label: 'Logout' }],
  },
  render: (args) => ({
    components: { DropdownMenu },
    setup() {
      return { args };
    },
    template: `
      <DropdownMenu
        :trigger="args.trigger"
        :items="args.items"
        :align="args.align"
        :side="args.side"
        :side-offset="args.sideOffset"
      />
    `,
  }),
};
