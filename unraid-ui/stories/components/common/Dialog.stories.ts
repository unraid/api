import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { Button } from '../../../src/components/common/button/index.js';
import { Dialog as DialogComponent } from '../../../src/components/common/dialog/index.js';

const meta = {
  title: 'Components/Common/Dialog',
  component: DialogComponent,
} satisfies Meta<typeof DialogComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Dialog: Story = {
  args: {
    title: 'Dialog Title',
    description: "This is a dialog description that explains what's happening.",
    triggerText: 'Open Dialog',
    showFooter: true,
    closeButtonText: 'Close',
    primaryButtonText: 'Save Changes',
  },
  render: (args) => ({
    components: { DialogComponent },
    setup() {
      const isOpen = ref(false);
      const handlePrimaryClick = () => {
        console.log('Primary button clicked');
        isOpen.value = false;
      };
      return { args, isOpen, handlePrimaryClick };
    },
    template: `
      <DialogComponent
        v-model="isOpen"
        :title="args.title"
        :description="args.description"
        :triggerText="args.triggerText"
        :showFooter="args.showFooter"
        :closeButtonText="args.closeButtonText"
        :primaryButtonText="args.primaryButtonText"
        @primary-click="handlePrimaryClick"
      />
    `,
  }),
};

export const SimpleDialog: Story = {
  args: {
    title: 'Delete Item?',
    description: 'This action cannot be undone.',
    triggerText: 'Delete',
    primaryButtonText: 'Confirm Delete',
  },
};

export const DialogWithoutPrimaryButton: Story = {
  args: {
    title: 'Information',
    description: 'This is just an informational dialog.',
    triggerText: 'Show Info',
    showFooter: true,
    closeButtonText: 'Got it',
  },
};

export const DialogWithCustomContent: Story = {
  render: () => ({
    components: { DialogComponent, Button },
    setup() {
      const isOpen = ref(false);
      return { isOpen };
    },
    template: `
      <DialogComponent v-model="isOpen" title="Custom Content Dialog">
        <template #trigger>
          <Button variant="secondary">Custom Trigger Button</Button>
        </template>
        <div style="padding: 20px 0;">
          <p>This dialog has custom content in the body.</p>
          <p>You can put any HTML or Vue components here.</p>
          <div style="margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 4px;">
            <code>Custom content area</code>
          </div>
        </div>
      </DialogComponent>
    `,
  }),
};

export const DialogWithCustomFooter: Story = {
  render: () => ({
    components: { DialogComponent, Button },
    setup() {
      const isOpen = ref(false);
      const handleCancel = () => {
        console.log('Cancel clicked');
        isOpen.value = false;
      };
      const handleSave = () => {
        console.log('Save clicked');
        isOpen.value = false;
      };
      const handleSaveAndClose = () => {
        console.log('Save and Close clicked');
        isOpen.value = false;
      };
      return { isOpen, handleCancel, handleSave, handleSaveAndClose };
    },
    template: `
      <DialogComponent v-model="isOpen" title="Custom Footer">
        <template #trigger>
          <Button>Open with Custom Footer</Button>
        </template>
        <p>This dialog has a completely custom footer with multiple actions.</p>
        <template #footer>
          <div style="display: flex; justify-content: space-between; width: 100%;">
            <Button variant="ghost" @click="handleCancel">Cancel</Button>
            <div style="display: flex; gap: 8px;">
              <Button variant="secondary" @click="handleSave">Save</Button>
              <Button variant="primary" @click="handleSaveAndClose">Save and Close</Button>
            </div>
          </div>
        </template>
      </DialogComponent>
    `,
  }),
};

export const DialogWithNoFooter: Story = {
  render: () => ({
    components: { DialogComponent },
    setup() {
      const isOpen = ref(false);
      return { isOpen };
    },
    template: `
      <DialogComponent 
        v-model="isOpen" 
        title="No Footer Dialog" 
        description="This dialog has no footer buttons."
        triggerText="Open Dialog"
        :showFooter="false"
      >
        <p style="padding: 20px 0;">Content without any footer buttons.</p>
      </DialogComponent>
    `,
  }),
};

export const DialogControlledProgrammatically: Story = {
  render: () => ({
    components: { DialogComponent, Button },
    setup() {
      const isOpen = ref(false);
      const openDialog = () => {
        isOpen.value = true;
      };
      const closeDialog = () => {
        isOpen.value = false;
      };
      return { isOpen, openDialog, closeDialog };
    },
    template: `
      <div>
        <Button @click="openDialog">Open Dialog Programmatically</Button>
        <DialogComponent 
          v-model="isOpen" 
          title="Controlled Dialog"
          description="This dialog is controlled programmatically without a trigger."
        >
          <p>This dialog was opened programmatically!</p>
          <template #footer>
            <Button @click="closeDialog">Close</Button>
          </template>
        </DialogComponent>
      </div>
    `,
  }),
};

export const DialogSizes: Story = {
  render: () => ({
    components: { DialogComponent, Button },
    setup() {
      const dialogs = ref({
        sm: false,
        md: false,
        lg: false,
        xl: false,
      });
      return { dialogs };
    },
    template: `
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <DialogComponent 
          v-model="dialogs.sm" 
          size="sm"
          title="Small Dialog"
          description="This is a small dialog (max-width: 24rem)"
          triggerText="Small (sm)"
          primaryButtonText="Save"
        >
          <p>This dialog has a small size, perfect for simple confirmations or brief messages.</p>
        </DialogComponent>

        <DialogComponent 
          v-model="dialogs.md" 
          size="md"
          title="Medium Dialog"
          description="This is a medium dialog (max-width: 32rem)"
          triggerText="Medium (md)"
          primaryButtonText="Save"
        >
          <p>This is the default dialog size, suitable for most use cases with moderate content.</p>
        </DialogComponent>

        <DialogComponent 
          v-model="dialogs.lg" 
          size="lg"
          title="Large Dialog"
          description="This is a large dialog (max-width: 42rem)"
          triggerText="Large (lg)"
          primaryButtonText="Save"
        >
          <p>Large dialogs provide more space for complex forms or detailed content that requires more horizontal space.</p>
          <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 4px;">
            <p>Additional content area to demonstrate the increased width.</p>
          </div>
        </DialogComponent>

        <DialogComponent 
          v-model="dialogs.xl" 
          size="xl"
          title="Extra Large Dialog"
          description="This is an extra large dialog (max-width: 56rem)"
          triggerText="Extra Large (xl)"
          primaryButtonText="Save"
        >
          <p>Extra large dialogs are ideal for complex interfaces, data tables, or content that needs maximum horizontal space.</p>
          <div style="margin-top: 16px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #ddd;">
                  <th style="text-align: left; padding: 8px;">Column 1</th>
                  <th style="text-align: left; padding: 8px;">Column 2</th>
                  <th style="text-align: left; padding: 8px;">Column 3</th>
                  <th style="text-align: left; padding: 8px;">Column 4</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px;">Data</td>
                  <td style="padding: 8px;">Data</td>
                  <td style="padding: 8px;">Data</td>
                  <td style="padding: 8px;">Data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DialogComponent>
      </div>
    `,
  }),
};
