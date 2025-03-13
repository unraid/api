import type { Meta, StoryObj } from '@storybook/vue3';
import BadgeComponent from '../../../src/components/common/badge/Badge.vue';

const meta = {
  title: 'Components/Common',
  component: BadgeComponent,
} satisfies Meta<typeof BadgeComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Badge: Story = {
  args: {
    variant: 'gray',
    size: 'md',
    default: 'Badge',
    class: '',
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/0hf6J6wv698NG8vQw6wl0M/Unraid-UI-Library?node-id=19-22&t=1Z3mfHcQ3a89yy5K-1',
    },
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
