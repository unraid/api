import type { Meta, StoryObj } from '@storybook/vue3';
import {
  Select as SelectComponent,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../../src/components/form/select';

const meta = {
  title: 'Components/Form/Select',
  component: SelectComponent,
} satisfies Meta<typeof SelectComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Select: Story = {
  render: (args) => ({
    components: {
      SelectComponent,
      SelectTrigger,
      SelectValue,
      SelectContent,
      SelectGroup,
      SelectLabel,
      SelectItem,
    },
    setup() {
      return { args };
    },
    template: `
        <SelectComponent>
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
              <SelectItem value="grape">Grape</SelectItem>
            </SelectGroup>
          </SelectContent>
        </SelectComponent>
    `,
  }),
};

export const Grouped: Story = {
  render: (args) => ({
    components: {
      SelectComponent,
      SelectTrigger,
      SelectValue,
      SelectContent,
      SelectGroup,
      SelectLabel,
      SelectItem,
    },
    setup() {
      return { args };
    },
    template: `
      <div>
        <unraid-modals></unraid-modals>
        <SelectComponent>
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Select a food" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="grape">Grape</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
              <SelectItem value="potato">Potato</SelectItem>
              <SelectItem value="celery">Celery</SelectItem>
            </SelectGroup>
          </SelectContent>
        </SelectComponent>
      </div>
    `,
  }),
};
