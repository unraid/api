import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Accordion } from '../../../src/components/common/accordion/index.js';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../src/components/ui/accordion/index.js';

const meta = {
  title: 'Components/Common/Accordion',
  component: Accordion,
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['single', 'multiple'],
    },
    collapsible: {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

// Basic usage with items prop
export const BasicUsage: Story = {
  args: {
    type: 'single',
    collapsible: true,
    items: [
      {
        value: 'item-1',
        title: 'Is it accessible?',
        content: 'Yes. It adheres to the WAI-ARIA design pattern.',
      },
      {
        value: 'item-2',
        title: 'Is it styled?',
        content: "Yes. It comes with default styles that matches the other components' aesthetic.",
      },
      {
        value: 'item-3',
        title: 'Is it animated?',
        content: "Yes. It's animated by default, but you can disable it if you prefer.",
      },
    ],
  },
  render: (args) => ({
    components: { Accordion },
    setup() {
      return { args };
    },
    template: `
      <Accordion
        :type="args.type"
        :collapsible="args.collapsible"
        :items="args.items"
        :class="args.class"
      />
    `,
  }),
};

// Items with custom slot content
export const ItemsWithCustomSlots: Story = {
  args: {
    type: 'single',
    collapsible: true,
    items: [
      {
        value: 'stats',
        title: 'User Statistics',
        content: 'View your usage statistics',
      },
      {
        value: 'settings',
        title: 'Account Settings',
        content: 'Manage your account preferences',
      },
      {
        value: 'notifications',
        title: 'Notifications',
        content: 'Configure notification preferences',
      },
    ],
  },
  render: (args) => ({
    components: { Accordion },
    setup() {
      return { args };
    },
    template: `
      <Accordion
        :type="args.type"
        :collapsible="args.collapsible"
        :items="args.items"
      >
        <template #trigger="{ item }">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <span style="font-weight: 500;">{{ item.title }}</span>
            <span style="background: #e0e0e0; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
              Custom
            </span>
          </div>
        </template>
        <template #content="{ item }">
          <div style="padding: 16px; background-color: #f8f8f8; border-radius: 4px;">
            <p style="margin: 0 0 12px 0;">{{ item.content }}</p>
            <button style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              Manage {{ item.title }}
            </button>
          </div>
        </template>
      </Accordion>
    `,
  }),
};

// Direct composition pattern
export const DirectComposition: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <div>
        <h3 style="margin-bottom: 16px;">Direct Composition Pattern</h3>
        <Accordion type="single" collapsible>
          <AccordionItem value="permissions">
            <AccordionTrigger>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>🔒</span>
                <span>Permissions Management</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div style="padding: 16px;">
                <p style="margin: 0 0 12px 0;">Manage user permissions and access control</p>
                <div style="display: flex; gap: 8px;">
                  <label><input type="checkbox" /> Read</label>
                  <label><input type="checkbox" /> Write</label>
                  <label><input type="checkbox" /> Delete</label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="api-keys">
            <AccordionTrigger>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>🔑</span>
                <span>API Keys</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div style="padding: 16px;">
                <p style="margin: 0 0 12px 0;">Create and manage API keys</p>
                <button style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px;">
                  Generate New Key
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="webhooks">
            <AccordionTrigger>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>🪝</span>
                <span>Webhooks</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div style="padding: 16px;">
                <p style="margin: 0 0 12px 0;">Configure webhook endpoints</p>
                <input type="text" placeholder="Webhook URL" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    `,
  }),
};

// Multiple mode with default values
export const MultipleMode: Story = {
  args: {
    type: 'multiple',
    defaultValue: ['item-1', 'item-3'],
    items: [
      {
        value: 'item-1',
        title: 'First Section (Default Open)',
        content: 'This section is open by default in multiple mode.',
      },
      {
        value: 'item-2',
        title: 'Second Section',
        content: 'Multiple sections can be open at the same time.',
      },
      {
        value: 'item-3',
        title: 'Third Section (Default Open)',
        content: 'This section is also open by default.',
      },
    ],
  },
  render: (args) => ({
    components: { Accordion },
    setup() {
      return { args };
    },
    template: `
      <Accordion
        :type="args.type"
        :default-value="args.defaultValue"
        :items="args.items"
      />
    `,
  }),
};

// Mixed usage pattern
export const MixedUsage: Story = {
  args: {
    items: [
      {
        value: 'auto-1',
        title: 'Auto-generated Item 1',
        content: 'This item comes from the items prop',
      },
      {
        value: 'auto-2',
        title: 'Auto-generated Item 2',
        content: 'This item also comes from the items prop',
      },
    ],
  },
  render: (args) => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() {
      return { args };
    },
    template: `
      <div>
        <h3 style="margin-bottom: 16px;">Mixed Usage (Direct + Items)</h3>
        <Accordion type="single" collapsible :items="args.items">
          <!-- Direct composition items render first -->
          <AccordionItem value="manual-1">
            <AccordionTrigger>
              <span style="color: #007bff;">📝 Manually Added Item</span>
            </AccordionTrigger>
            <AccordionContent>
              <div style="padding: 16px; background: #e3f2fd; border-radius: 4px;">
                This item was added using direct composition and appears before items from props.
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <!-- Items from props will render after -->
        </Accordion>
      </div>
    `,
  }),
};

// Dynamic component pattern
export const DynamicComponents: Story = {
  render: () => ({
    components: { Accordion },
    setup() {
      // Mock components
      const PermissionsPanel = {
        template: `
          <div style="padding: 16px; background: #f0f8ff; border-radius: 4px;">
            <h4 style="margin: 0 0 8px 0;">Permission Settings</h4>
            <label style="display: block; margin: 4px 0;"><input type="checkbox" checked /> Admin Access</label>
            <label style="display: block; margin: 4px 0;"><input type="checkbox" /> Editor Access</label>
            <label style="display: block; margin: 4px 0;"><input type="checkbox" checked /> Viewer Access</label>
          </div>
        `,
      };

      const ProfilePanel = {
        template: `
          <div style="padding: 16px; background: #f0fff0; border-radius: 4px;">
            <h4 style="margin: 0 0 8px 0;">User Profile</h4>
            <input type="text" value="John Doe" style="width: 100%; padding: 8px; margin: 4px 0; border: 1px solid #ddd; border-radius: 4px;" />
            <input type="email" value="john@example.com" style="width: 100%; padding: 8px; margin: 4px 0; border: 1px solid #ddd; border-radius: 4px;" />
          </div>
        `,
      };

      const SettingsPanel = {
        template: `
          <div style="padding: 16px; background: #fff0f0; border-radius: 4px;">
            <h4 style="margin: 0 0 8px 0;">Application Settings</h4>
            <label style="display: block; margin: 4px 0;"><input type="checkbox" checked /> Enable notifications</label>
            <label style="display: block; margin: 4px 0;"><input type="checkbox" /> Dark mode</label>
            <label style="display: block; margin: 4px 0;"><input type="checkbox" checked /> Auto-save</label>
          </div>
        `,
      };

      const componentMap = {
        permissions: PermissionsPanel,
        profile: ProfilePanel,
        settings: SettingsPanel,
      };

      const items = [
        { value: 'item-1', title: 'Permissions', componentType: 'permissions' },
        { value: 'item-2', title: 'Profile', componentType: 'profile' },
        { value: 'item-3', title: 'Settings', componentType: 'settings' },
      ];

      return { items, componentMap };
    },
    template: `
      <div>
        <h3 style="margin-bottom: 16px;">Dynamic Components Pattern</h3>
        <Accordion :items="items">
          <template #content="{ item }">
            <component :is="componentMap[item.componentType]" />
          </template>
        </Accordion>
      </div>
    `,
  }),
};

// Disabled items
export const DisabledItems: Story = {
  args: {
    type: 'single',
    collapsible: true,
    items: [
      {
        value: 'item-1',
        title: 'Enabled Item',
        content: 'This item can be toggled.',
      },
      {
        value: 'item-2',
        title: 'Disabled Item',
        content: 'This item cannot be toggled.',
        disabled: true,
      },
      {
        value: 'item-3',
        title: 'Another Enabled Item',
        content: 'This item can also be toggled.',
      },
    ],
  },
  render: (args) => ({
    components: { Accordion },
    setup() {
      return { args };
    },
    template: `
      <Accordion
        :type="args.type"
        :collapsible="args.collapsible"
        :items="args.items"
      />
    `,
  }),
};
