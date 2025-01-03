import type { Meta, StoryObj } from "@storybook/vue3";
import SheetComponent from "../../../src/components/common/sheet/Sheet.vue";
import SheetTrigger from "../../../src/components/common/sheet/SheetTrigger.vue";
import SheetContent from "../../../src/components/common/sheet/SheetContent.vue";
import SheetHeader from "../../../src/components/common/sheet/SheetHeader.vue";
import SheetTitle from "../../../src/components/common/sheet/SheetTitle.vue";
import SheetDescription from "../../../src/components/common/sheet/SheetDescription.vue";
import SheetFooter from "../../../src/components/common/sheet/SheetFooter.vue";
import Button from "../../../src/components/common/button/Button.vue";

const meta = {
  title: "Components/Common",
  component: SheetComponent,
  subcomponents: { 
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
  },
} satisfies Meta<typeof SheetComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sheet: Story = {
  render: (args) => ({
    components: {
      SheetComponent,
      SheetTrigger,
      SheetContent,
      SheetHeader,
      SheetTitle,
      SheetDescription,
      SheetFooter,
      Button,
    },
    template: `
      <div class="inline-flex items-center gap-4 p-4">
        <SheetComponent>
          <SheetTrigger>
            <Button variant="outline">Open Right</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Edit Profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you're done.
              </SheetDescription>
            </SheetHeader>
            <div class="my-6">Sheet content goes here...</div>
            <SheetFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save changes</Button>
            </SheetFooter>
          </SheetContent>
        </SheetComponent>

        <SheetComponent>
          <SheetTrigger>
            <Button variant="outline">Open Left</Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Left Side Sheet</SheetTitle>
            </SheetHeader>
            <div class="py-6">Content from the left side</div>
          </SheetContent>
        </SheetComponent>

        <SheetComponent>
          <SheetTrigger>
            <Button variant="outline">Open Top</Button>
          </SheetTrigger>
          <SheetContent side="top" padding="none">
            <div class="p-4">Top sheet with no padding variant</div>
          </SheetContent>
        </SheetComponent>
      </div>
    `,
  }),
};
