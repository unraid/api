import { DropdownMenu } from '@/components/common/dropdown-menu';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

const meta = {
  title: 'Components/Common/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end'],
    },
    side: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left'],
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

// Basic props-based usage
export const BasicUsage: Story = {
  args: {
    trigger: 'Options',
    items: [{ label: 'Profile' }, { label: 'Settings' }, { type: 'separator' }, { label: 'Logout' }],
  },
  render: (args) => ({
    components: { DropdownMenu },
    setup() {
      return { args };
    },
    template: `
      <DropdownMenu
        :trigger="args.trigger"
        :items="args.items"
        :align="args.align"
        :side="args.side"
        :side-offset="args.sideOffset"
      />
    `,
  }),
};

// User account menu
export const UserAccountMenu: Story = {
  args: {
    trigger: 'John Doe',
    items: [
      { type: 'label', label: 'john.doe@example.com' },
      { type: 'separator' },
      { label: 'Profile Settings' },
      { label: 'Account Security' },
      { label: 'Billing & Plans' },
      { type: 'separator' },
      { label: 'Help & Support' },
      { label: 'Keyboard Shortcuts', disabled: true },
      { type: 'separator' },
      { label: 'Sign Out' },
    ],
  },
};

// File operations menu
export const FileOperationsMenu: Story = {
  args: {
    trigger: 'File Actions',
    items: [
      { label: 'New File' },
      { label: 'New Folder' },
      { type: 'separator' },
      { label: 'Copy' },
      { label: 'Cut' },
      { label: 'Paste', disabled: true },
      { type: 'separator' },
      { label: 'Rename' },
      { label: 'Delete' },
      { type: 'separator' },
      { label: 'Properties' },
    ],
  },
};

// Context menu style
export const ContextMenu: Story = {
  args: {
    trigger: 'Right Click Me',
    align: 'start',
    items: [
      { label: 'Back', disabled: true },
      { label: 'Forward', disabled: true },
      { label: 'Reload' },
      { type: 'separator' },
      { label: 'Save As...' },
      { label: 'Print...' },
      { label: 'Cast...' },
      { type: 'separator' },
      { label: 'View Page Source' },
      { label: 'Inspect' },
    ],
  },
};

// Settings menu with grouped items
export const SettingsMenu: Story = {
  args: {
    trigger: '⚙️ Settings',
    items: [
      { type: 'label', label: 'Appearance' },
      { label: 'Theme' },
      { label: 'Font Size' },
      { type: 'separator' },
      { type: 'label', label: 'Privacy' },
      { label: 'Clear Browsing Data' },
      { label: 'Cookie Settings' },
      { type: 'separator' },
      { type: 'label', label: 'Advanced' },
      { label: 'Developer Options' },
      { label: 'Experimental Features' },
    ],
  },
};

// Dropdown with click handlers
export const WithClickHandlers: Story = {
  args: {
    trigger: 'Actions',
    items: [
      {
        label: 'Alert',
        onClick: () => alert('Alert clicked!'),
      },
      {
        label: 'Console Log',
        onClick: () => console.log('Console log clicked!'),
      },
      { type: 'separator' },
      {
        label: 'Disabled Action',
        disabled: true,
        onClick: () => console.log('This should not fire'),
      },
    ],
  },
};

// Different alignments
export const AlignmentVariations: Story = {
  render: () => ({
    components: { DropdownMenu },
    template: `
      <div style="display: flex; justify-content: space-around; padding: 100px 20px;">
        <DropdownMenu
          trigger="Align Start"
          :items="[{ label: 'Item 1' }, { label: 'Item 2' }, { label: 'Item 3' }]"
          align="start"
        />
        <DropdownMenu
          trigger="Align Center"
          :items="[{ label: 'Item 1' }, { label: 'Item 2' }, { label: 'Item 3' }]"
          align="center"
        />
        <DropdownMenu
          trigger="Align End"
          :items="[{ label: 'Item 1' }, { label: 'Item 2' }, { label: 'Item 3' }]"
          align="end"
        />
      </div>
    `,
  }),
};

// Different side positions
export const SidePositions: Story = {
  render: () => ({
    components: { DropdownMenu },
    template: `
      <div style="display: flex; justify-content: center; align-items: center; height: 400px; gap: 40px;">
        <DropdownMenu
          trigger="Top"
          :items="[{ label: 'Item 1' }, { label: 'Item 2' }]"
          side="top"
        />
        <DropdownMenu
          trigger="Right"
          :items="[{ label: 'Item 1' }, { label: 'Item 2' }]"
          side="right"
        />
        <DropdownMenu
          trigger="Bottom"
          :items="[{ label: 'Item 1' }, { label: 'Item 2' }]"
          side="bottom"
        />
        <DropdownMenu
          trigger="Left"
          :items="[{ label: 'Item 1' }, { label: 'Item 2' }]"
          side="left"
        />
      </div>
    `,
  }),
};

// Custom trigger with slot
export const CustomTrigger: Story = {
  render: () => ({
    components: { DropdownMenu },
    template: `
      <DropdownMenu
        :items="[
          { label: 'Edit' },
          { label: 'Duplicate' },
          { type: 'separator' },
          { label: 'Archive' },
          { label: 'Delete' }
        ]"
      >
        <template #trigger>
          <button style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Custom Button Trigger
          </button>
        </template>
      </DropdownMenu>
    `,
  }),
};

// Long menu with scroll
export const LongMenuWithScroll: Story = {
  args: {
    trigger: 'Many Options',
    items: Array.from({ length: 20 }, (_, i) => ({
      label: `Option ${i + 1}`,
    })),
  },
};

// Empty state
export const EmptyState: Story = {
  args: {
    trigger: 'Empty Menu',
    items: [],
  },
};
