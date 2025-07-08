import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ScrollArea, ScrollBar } from '../../../src/components/common/scroll-area/index.js';

const meta = {
  title: 'Components/Common/ScrollArea',
  component: ScrollArea,
  subcomponents: { ScrollBar },
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  args: {
    class: 'rounded-md border',
    style: {
      height: '200px',
      width: '350px',
    },
  },
  render: (args) => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      const items = Array(30)
        .fill(0)
        .map((_, i) => `Content ${i + 1}`);
      return { args, items };
    },
    template: `
      <ScrollArea v-bind="args">
        <div class="p-4">
          <div class="space-y-1">
            <div v-for="(item, i) in items" :key="i" class="text-sm">
              {{ item }}
            </div>
          </div>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    `,
  }),
};

export const Horizontal: Story = {
  args: {
    class: 'rounded-md border',
    style: {
      height: '80px',
      width: '350px',
    },
  },
  render: (args) => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      return { args };
    },
    template: `
      <ScrollArea v-bind="args">
        <div class="flex p-4">
          ${Array(50)
            .fill(0)
            .map((_, i) => `<div class="flex-shrink-0 mr-2">Content ${i + 1}</div>`)
            .join('')}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    `,
  }),
};
