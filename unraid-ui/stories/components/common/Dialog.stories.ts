import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import Button from '../../../src/components/common/button/Button.vue';
import DialogComponent from '../../../src/components/common/dialog/Dialog.vue';

const meta = {
  title: 'Components/Common',
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
