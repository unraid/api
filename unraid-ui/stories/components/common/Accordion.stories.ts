import type { Meta, StoryObj } from '@storybook/vue3';
import AccordionComponent from '../../../src/components/common/accordion/Accordion.vue';

const meta = {
  title: 'Components/Common/Accordion',
  component: AccordionComponent,
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['single', 'multiple'],
    },
    collapsible: {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof AccordionComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Accordion: Story = {
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
    components: { AccordionComponent },
    setup() {
      return { args };
    },
    template: `
      <AccordionComponent
        :type="args.type"
        :collapsible="args.collapsible"
        :items="args.items"
        :class="args.class"
      />
    `,
  }),
};

export const AccordionWithCustomContent: Story = {
  args: {
    type: 'single',
    collapsible: true,
    items: [
      {
        value: 'custom-1',
        title: 'Custom Trigger Content',
        content: 'This item has custom trigger content',
      },
      {
        value: 'custom-2',
        title: 'Another Custom Item',
        content: 'This demonstrates slot usage',
      },
    ],
  },
  render: (args) => ({
    components: { AccordionComponent },
    setup() {
      return { args };
    },
    template: `
      <AccordionComponent
        :type="args.type"
        :collapsible="args.collapsible"
        :items="args.items"
      >
        <template #trigger="{ item }">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🎯</span>
            <span>{{ item.title }}</span>
          </div>
        </template>
        <template #content="{ item }">
          <div style="padding: 16px; background-color: #f0f0f0; border-radius: 4px;">
            <p style="margin: 0;">{{ item.content }}</p>
            <button style="margin-top: 8px;">Action Button</button>
          </div>
        </template>
      </AccordionComponent>
    `,
  }),
};

export const AccordionMultiple: Story = {
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
    components: { AccordionComponent },
    setup() {
      return { args };
    },
    template: `
      <AccordionComponent
        :type="args.type"
        :default-value="args.defaultValue"
        :items="args.items"
      />
    `,
  }),
};

export const AccordionDisabled: Story = {
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
    components: { AccordionComponent },
    setup() {
      return { args };
    },
    template: `
      <AccordionComponent
        :type="args.type"
        :collapsible="args.collapsible"
        :items="args.items"
      />
    `,
  }),
};

export const AccordionSlotOnly: Story = {
  render: () => ({
    components: { AccordionComponent },
    template: `
      <div>
        <h3 style="margin-bottom: 16px;">Accordion with slot-based content only</h3>
        <AccordionComponent type="single" collapsible>
          <div style="border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 4px;">
            <div style="padding: 16px; cursor: pointer; background: #f5f5f5;">
              <strong>Manual Item 1</strong>
            </div>
            <div style="padding: 16px;">
              Content for manual item 1. This demonstrates using the accordion
              with completely custom slot content instead of the items prop.
            </div>
          </div>
          <div style="border: 1px solid #e0e0e0; border-radius: 4px;">
            <div style="padding: 16px; cursor: pointer; background: #f5f5f5;">
              <strong>Manual Item 2</strong>
            </div>
            <div style="padding: 16px;">
              Content for manual item 2. You have full control over the structure.
            </div>
          </div>
        </AccordionComponent>
      </div>
    `,
  }),
};
