import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../../../src/components/common/button/Button.vue';
import SheetComponent from '../../../src/components/common/sheet/Sheet.vue';
import SheetContent from '../../../src/components/common/sheet/SheetContent.vue';
import SheetDescription from '../../../src/components/common/sheet/SheetDescription.vue';
import SheetFooter from '../../../src/components/common/sheet/SheetFooter.vue';
import SheetHeader from '../../../src/components/common/sheet/SheetHeader.vue';
import SheetTitle from '../../../src/components/common/sheet/SheetTitle.vue';
import SheetTrigger from '../../../src/components/common/sheet/SheetTrigger.vue';
import Select from '../../../src/components/form/select/Select.vue';
import SelectContent from '../../../src/components/form/select/SelectContent.vue';
import SelectItem from '../../../src/components/form/select/SelectItem.vue';
import SelectTrigger from '../../../src/components/form/select/SelectTrigger.vue';
import SelectValue from '../../../src/components/form/select/SelectValue.vue';

const meta = {
  title: 'Components/Common',
  component: SheetComponent,
  subcomponents: {
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    Select,
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="min-height: 100vh;"><story /></div>',
    }),
  ],
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
            <div class="py-6">Sheet content goes here...</div>
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

export const SheetWithSelect: Story = {
  render: () => ({
    components: {
      SheetComponent,
      SheetTrigger,
      SheetContent,
      SheetHeader,
      SheetTitle,
      SheetDescription,
      SheetFooter,
      Button,
      Select,
      SelectTrigger,
      SelectContent,
      SelectItem,
      SelectValue,
    },
    data() {
      return {
        theme: 'light',
      };
    },
    template: `
      <div class="inline-flex items-center gap-4 p-4">
        <SheetComponent>
          <SheetTrigger>
            <Button variant="outline">Open Form Sheet</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>User Preferences</SheetTitle>
              <SheetDescription>
                Configure your user preferences using the form below.
              </SheetDescription>
            </SheetHeader>
            <div class="py-6">
              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium">Theme</label>
                  <Select v-model="theme">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save changes</Button>
            </SheetFooter>
          </SheetContent>
        </SheetComponent>
      </div>
    `,
  }),
};
