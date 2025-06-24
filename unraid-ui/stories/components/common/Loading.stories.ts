import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Bar from '../../../src/components/common/loading/Bar.vue';
import Error from '../../../src/components/common/loading/Error.vue';
import Spinner from '../../../src/components/common/loading/Spinner.vue';

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
  render: (args) => ({
    components: { Bar },
    template: `<div class="w-full max-w-md"><Bar v-bind="args" /></div>`,
  }),
};

export const LoadingSpinner: SpinnerStory = {
  args: {},
  render: (args) => ({
    components: { Spinner },
    template: `<div class="p-4"><Spinner v-bind="args" /></div>`,
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
