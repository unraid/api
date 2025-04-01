import { ArrowDownTrayIcon, KeyIcon, RocketLaunchIcon } from '@heroicons/vue/24/outline';
import type { Meta, StoryObj } from '@storybook/vue3';
import ButtonComponent from '../../../src/components/common/button/Button.vue';

const meta = {
  title: 'Components/Common/Button',
  component: ButtonComponent,
  tags: ['autodocs'],
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

export const ButtonLeftIcon: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    default: 'Click me',
    icon: ArrowDownTrayIcon,
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
        :icon="args.icon"
      >
        {{ args.default }}
      </ButtonComponent>
    `,
  }),
};

export const ButtonIcon: Story = {
  args: {
    variant: 'primary',
    size: 'icon',
    default: '',
  },
  render: (args) => ({
    components: { ButtonComponent, RocketLaunchIcon },
    setup() {
      return { args };
    },
    template: `
      <ButtonComponent
        :variant="args.variant"
        :size="args.size"
        :class="args.class"
      >
        <RocketLaunchIcon class="w-4 h-4" />
      </ButtonComponent>
    `,
  }),
};
