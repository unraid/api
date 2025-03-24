import type { Preview } from '@storybook/vue3';
import '../src/styles/globals.css';
import { registerAllComponents } from '../src/register';

registerAllComponents({});

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  // Add decorator to include modals container in every story
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div>
          <div id="modals"></div>
          <story />
        </div>
      `,
    }),
  ],
};

export default preview;
