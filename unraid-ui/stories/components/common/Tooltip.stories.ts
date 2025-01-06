import type { Meta, StoryObj } from "@storybook/vue3";
import { Tooltip as TooltipComponent, TooltipTrigger, TooltipContent, TooltipProvider } from "../../../src/components/common/tooltip";
import { Button } from "../../../src/components/common/button";

const meta = {
  title: "Components/Common",
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
      <div>
        <div id="modals"></div>
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
      </div>
    `,
  }),
};
