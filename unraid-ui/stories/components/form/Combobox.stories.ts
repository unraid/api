import type { Meta, StoryObj } from '@storybook/vue3';
import {
  Combobox as ComboboxComponent,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '../../../src/components/form/combobox';

const meta = {
  title: 'Components/Form/Combobox',
  component: ComboboxComponent,
} satisfies Meta<typeof ComboboxComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Combobox: Story = {
  render: (args) => ({
    components: {
      ComboboxComponent,
      ComboboxAnchor,
      ComboboxTrigger,
      ComboboxInput,
      ComboboxList,
      ComboboxGroup,
      ComboboxItem,
    },
    setup() {
      return { args };
    },
    template: `
      <ComboboxComponent>
        <ComboboxAnchor class="w-[180px]">
          <ComboboxTrigger>
            <ComboboxInput placeholder="Select a fruit" />
          </ComboboxTrigger>
        </ComboboxAnchor>
        <ComboboxList>
            <ComboboxGroup>
              <ComboboxItem value="apple">Apple</ComboboxItem>
              <ComboboxItem value="banana">Banana</ComboboxItem>
              <ComboboxItem value="orange">Orange</ComboboxItem>
              <ComboboxItem value="grape">Grape</ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxComponent>
    `,
  }),
};

export const Grouped: Story = {
  render: (args) => ({
    components: {
      ComboboxComponent,
      ComboboxTrigger,
      ComboboxInput,
      ComboboxList,
      ComboboxGroup,
      ComboboxItem,
      ComboboxEmpty,
    },
    setup() {
      return { args };
    },
    template: `
      <div>
        <ComboboxComponent>
          <ComboboxTrigger class="w-[180px]">
            <ComboboxInput placeholder="Select a food" />
          </ComboboxTrigger>
          <ComboboxList>
            <ComboboxEmpty>No results found</ComboboxEmpty>
            <ComboboxGroup>
              <ComboboxItem value="apple">Apple</ComboboxItem>
              <ComboboxItem value="banana">Banana</ComboboxItem>
              <ComboboxItem value="grape">Grape</ComboboxItem>
            </ComboboxGroup>
            <ComboboxGroup>
              <ComboboxItem value="carrot">Carrot</ComboboxItem>
              <ComboboxItem value="potato">Potato</ComboboxItem>
              <ComboboxItem value="celery">Celery</ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxComponent>
      </div>
    `,
  }),
}; 