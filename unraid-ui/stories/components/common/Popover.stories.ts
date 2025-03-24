import type { Meta, StoryObj } from '@storybook/vue3';
import { Button } from '../../../src/components/common/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../../src/components/common/popover';

const meta = {
  title: 'Components/Common/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls the open state of the popover',
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Popover, PopoverContent, PopoverTrigger, Button },
    template: `
      <div class="p-8">
        <Popover>
          <PopoverTrigger>
            <Button>Open Popover</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="center" :side-offset="8">
            <div class="space-y-4">
              <h4 class="font-medium leading-none">Dimensions</h4>
              <p class="text-sm text-muted-foreground">
                Set the dimensions for the layer.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
};

export const WithCustomPosition: Story = {
  render: () => ({
    components: { Popover, PopoverContent, PopoverTrigger, Button },
    template: `
      <div class="p-8">
        <Popover>
          <PopoverTrigger>
            <Button>Open Popover</Button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" :side-offset="8">
            <div class="space-y-4">
              <h4 class="font-medium leading-none">Custom Position</h4>
              <p class="text-sm text-muted-foreground">
                This popover is positioned on the right side with custom offset.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
};
