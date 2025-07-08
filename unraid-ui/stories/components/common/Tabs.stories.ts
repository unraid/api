import type { Meta, StoryObj } from '@storybook/vue3-vite';
import {
  Tabs as TabsComponent,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../src/components/common/tabs';

const meta = {
  title: 'Components/Common',
  component: TabsComponent,
} satisfies Meta<typeof TabsComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tabs: Story = {
  args: {
    defaultValue: 'tab1',
  },
  render: (args) => ({
    components: { TabsComponent, TabsList, TabsTrigger, TabsContent },
    setup() {
      return { args };
    },
    template: `
      <TabsComponent :default-value="args.defaultValue" class="w-[400px]">
        <TabsList>
          <TabsTrigger value="tab1">Account</TabsTrigger>
          <TabsTrigger value="tab2">Password</TabsTrigger>
          <TabsTrigger value="tab3">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">
          <div class="p-4">Account settings content</div>
        </TabsContent>
        <TabsContent value="tab2">
          <div class="p-4">Password settings content</div>
        </TabsContent>
        <TabsContent value="tab3">
          <div class="p-4">Other settings content</div>
        </TabsContent>
      </TabsComponent>
    `,
  }),
};
