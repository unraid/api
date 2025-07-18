import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { BrandButton } from '../../../src/components/brand/index.js';

const meta = {
  title: 'Components/Brand',
  component: BrandButton,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'fill',
        'black',
        'gray',
        'outline',
        'outline-primary',
        'outline-black',
        'outline-white',
        'underline',
        'underline-hover-red',
        'white',
        'none',
      ],
    },
    size: {
      control: { type: 'select' },
      options: ['12px', '14px', '16px', '18px', '20px', '24px'],
    },
    padding: {
      control: { type: 'select' },
      options: ['default', 'none', 'lean'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    text: {
      control: { type: 'text' },
    },
  },
  args: {
    variant: 'fill',
    size: '16px',
    padding: 'default',
    text: 'Click me',
    disabled: false,
  },
} satisfies Meta<typeof BrandButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => ({
    components: { BrandButton },
    template: `
      <div class="grid grid-cols-3 gap-4 p-4">
        <div class="bg-gray-900 p-2 rounded">
          <BrandButton variant="fill" text="Fill" />
        </div>
        <BrandButton variant="black" text="Black" />
        <BrandButton variant="gray" text="Gray" />
        <BrandButton variant="outline" text="Outline" />
        <BrandButton variant="outline-primary" text="Outline Primary" />
        <BrandButton variant="outline-black" text="Outline Black" />
        <div class="bg-gray-900 p-2 rounded">
          <BrandButton variant="outline-white" text="Outline White" />
        </div>
        <BrandButton variant="underline" text="Underline" />
        <BrandButton variant="underline-hover-red" text="Underline Hover Red" />
        <BrandButton variant="white" text="White" />
        <BrandButton variant="none" text="None" />
      </div>
    `,
  }),
};

export const AllSizes: Story = {
  render: () => ({
    components: { BrandButton },
    template: `
      <div class="flex flex-col gap-4 p-4">
        <BrandButton size="12px" text="12px" />
        <BrandButton size="14px" text="14px" />
        <BrandButton size="16px" text="16px" />
        <BrandButton size="18px" text="18px" />
        <BrandButton size="20px" text="20px" />
        <BrandButton size="24px" text="24px" />
      </div>
    `,
  }),
};

export const AllPadding: Story = {
  render: () => ({
    components: { BrandButton },
    template: `
      <div class="flex flex-col gap-4 p-4">
        <BrandButton padding="default" text="Default Padding" />
        <BrandButton padding="none" text="No Padding" />
        <BrandButton padding="lean" text="Lean Padding" />
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    text: 'Disabled Button',
  },
};
