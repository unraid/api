import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Bar, Error, Spinner } from '../../../src/components/common/loading/index.js';

const meta = {
  title: 'Components/Common/Loading',
  component: Bar,
  subcomponents: { Bar, Spinner, Error },
} satisfies Meta<typeof Bar>;

export default meta;

type BarStory = StoryObj<typeof Bar>;
type SpinnerStory = StoryObj<typeof Spinner>;
type ErrorStory = StoryObj<typeof Error>;

export const LoadingBar: BarStory = {
  args: {},
  render: () => ({
    components: { Bar },
    template: `<div class="w-full max-w-md"><Bar /></div>`,
  }),
};

export const LoadingSpinner: SpinnerStory = {
  args: {},
  render: () => ({
    components: { Spinner },
    template: `<div class="p-4"><Spinner /></div>`,
  }),
};

export const LoadingError: ErrorStory = {
  args: {
    loading: false,
    error: null,
    class: '',
  },
  render: (args) => ({
    components: { Error },
    setup() {
      return { args };
    },
    template: `
 
        <Error v-bind="args">
          <div class="text-center">Content when not loading or error</div>
        </Error>
      </div>
    `,
  }),
};
