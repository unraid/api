import { Select } from '@/components/form/select';
import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';

const meta = {
  title: 'Components/Form/Select',
  component: Select,
  parameters: {
    docs: {
      description: {
        component:
          'A custom Select component that accepts an items prop for easy rendering of options. Supports simple arrays, object arrays, and grouped items with labels and separators.',
      },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no value is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
    multiple: {
      control: 'boolean',
      description: 'Whether multiple items can be selected',
    },
    valueKey: {
      control: 'text',
      description: 'Key to use for item values when using object arrays',
    },
    labelKey: {
      control: 'text',
      description: 'Key to use for item labels when using object arrays',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SimpleArray: Story = {
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref(null);

      return { args, value };
    },
    template: `
      <div class="space-y-4">
        <Select 
          v-model="value" 
          :items="args.items"
          :placeholder="args.placeholder"
          :valueKey="args.valueKey"
          :labelKey="args.labelKey"
        />
        <p class="text-sm text-muted-foreground">Selected: {{ value }}</p>
        <p class="text-sm">Items: {{ args.items }}</p>
      </div>
    `,
  }),
  args: {
    placeholder: 'Select a fruit',
    items: ['Apple', 'Banana', 'Orange', 'Grape', 'Mango'],
  },
};

export const ObjectArray: Story = {
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref(null);

      return { args, value };
    },
    template: `
      <div class="space-y-4">
        <Select 
          v-model="value" 
          :items="args.items"
          :placeholder="args.placeholder"
          :valueKey="args.valueKey"
          :labelKey="args.labelKey"
        />
        <p class="text-sm text-muted-foreground">Selected: {{ value }}</p>
      </div>
    `,
  }),
  args: {
    placeholder: 'Select a color',
    items: [
      { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' },
      { value: 'blue', label: 'Blue' },
      { value: 'yellow', label: 'Yellow' },
      { value: 'purple', label: 'Purple' },
    ],
  },
};

export const GroupedItems: Story = {
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref(null);

      return { args, value };
    },
    template: `
      <div class="space-y-4">
        <Select 
          v-model="value" 
          :items="args.items"
          :placeholder="args.placeholder"
          :valueKey="args.valueKey"
          :labelKey="args.labelKey"
        />
        <p class="text-sm text-muted-foreground">Selected: {{ value }}</p>
      </div>
    `,
  }),
  args: {
    placeholder: 'Select food',
    items: [
      [
        { type: 'label', label: 'Fruits' },
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'orange', label: 'Orange' },
      ],
      [
        { type: 'label', label: 'Vegetables' },
        { value: 'carrot', label: 'Carrot' },
        { value: 'lettuce', label: 'Lettuce' },
        { value: 'tomato', label: 'Tomato' },
      ],
    ],
  },
};

export const WithDisabledItems: Story = {
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref(null);

      return { args, value };
    },
    template: `
      <div class="space-y-4">
        <Select 
          v-model="value" 
          :items="args.items"
          :placeholder="args.placeholder"
          :valueKey="args.valueKey"
          :labelKey="args.labelKey"
        />
        <p class="text-sm text-muted-foreground">Selected: {{ value }}</p>
      </div>
    `,
  }),
  args: {
    placeholder: 'Select an option',
    items: [
      { value: 'active', label: 'Active' },
      { value: 'disabled1', label: 'Disabled Option 1', disabled: true },
      { value: 'enabled', label: 'Enabled' },
      { value: 'disabled2', label: 'Disabled Option 2', disabled: true },
    ],
  },
};

export const WithSeparators: Story = {
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref(null);

      return { args, value };
    },
    template: `
      <div class="space-y-4">
        <Select 
          v-model="value" 
          :items="args.items"
          :placeholder="args.placeholder"
          :valueKey="args.valueKey"
          :labelKey="args.labelKey"
        />
        <p class="text-sm text-muted-foreground">Selected: {{ value }}</p>
      </div>
    `,
  }),
  args: {
    placeholder: 'Select action',
    items: [
      { value: 'new', label: 'New File' },
      { value: 'open', label: 'Open File' },
      { type: 'separator' },
      { value: 'save', label: 'Save' },
      { value: 'saveas', label: 'Save As...' },
      { type: 'separator' },
      { value: 'exit', label: 'Exit' },
    ],
  },
};

export const ControlledValue: Story = {
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref('banana');

      return { args, value };
    },
    template: `
      <div class="space-y-4">
        <Select 
          v-model="value" 
          :items="args.items"
          :placeholder="args.placeholder"
          :valueKey="args.valueKey"
          :labelKey="args.labelKey"
        />
        <p class="text-sm text-muted-foreground">Selected value: {{ value }}</p>
      </div>
    `,
  }),
  args: {
    placeholder: 'Select a fruit',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
    ],
  },
};

export const MultipleSelection: Story = {
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref(['apple', 'orange']);

      return { args, value };
    },
    template: `
      <div class="space-y-4">
        <Select 
          v-model="value" 
          :items="args.items"
          :placeholder="args.placeholder"
          :multiple="args.multiple"
          :valueKey="args.valueKey"
          :labelKey="args.labelKey"
        />
        <p class="text-sm text-muted-foreground">Selected values: {{ Array.isArray(value) ? value.join(', ') : value }}</p>
      </div>
    `,
  }),
  args: {
    placeholder: 'Select fruits',
    multiple: true,
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
      { value: 'grape', label: 'Grape' },
      { value: 'mango', label: 'Mango' },
    ],
  },
};

export const CustomSlots: Story = {
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref(null);

      return { args, value };
    },
    template: `
      <div class="space-y-4">
        <Select 
          v-model="value"
          :items="args.items"
          :placeholder="args.placeholder"
          :valueKey="args.valueKey"
          :labelKey="args.labelKey"
        >
          <template #item="{ item }">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.color }"></span>
              {{ item.label }}
            </div>
          </template>
        </Select>
        <p class="text-sm text-muted-foreground">Selected: {{ value }}</p>
      </div>
    `,
  }),
  args: {
    placeholder: 'Select a color',
    items: [
      { value: 'red', label: 'Red', color: '#ef4444' },
      { value: 'green', label: 'Green', color: '#22c55e' },
      { value: 'blue', label: 'Blue', color: '#3b82f6' },
      { value: 'yellow', label: 'Yellow', color: '#eab308' },
      { value: 'purple', label: 'Purple', color: '#a855f7' },
    ],
  },
};

export const DisabledSelect: Story = {
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref(null);
      return { args, value };
    },
    template: `
      <div class="space-y-4">
        <Select 
          v-model="value" 
          :items="args.items"
          :placeholder="args.placeholder"
          :disabled="args.disabled"
          :valueKey="args.valueKey"
          :labelKey="args.labelKey"
        />
        <p class="text-sm text-muted-foreground">Selected: {{ value }}</p>
        <p class="text-xs text-muted-foreground">The entire select is disabled</p>
      </div>
    `,
  }),
  args: {
    placeholder: 'This select is disabled',
    disabled: true,
    items: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
  },
};
