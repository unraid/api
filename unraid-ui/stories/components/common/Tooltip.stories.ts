import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Button } from '../../../src/components/common/button';
import {
  Tooltip as TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../src/components/common/tooltip';

const meta = {
  title: 'Components/Common',
  component: TooltipComponent,
} satisfies Meta<typeof TooltipComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tooltip: Story = {
  args: {
    defaultOpen: false,
  },
  render: (args) => ({
    components: { TooltipProvider, TooltipComponent, TooltipTrigger, TooltipContent, Button },
    setup() {
      return { args };
    },
    template: `
        <div class="p-20 flex items-center justify-start">
          <TooltipProvider>
            <TooltipComponent :default-open="args.defaultOpen">
              <TooltipTrigger as-child>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to library</p>
              </TooltipContent>
            </TooltipComponent>
          </TooltipProvider>
        </div>
    `,
  }),
};
