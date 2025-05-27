import type { Preview } from '@storybook/vue3';
import { registerAllComponents } from '../src/register';
import '@/styles/index.css';

registerAllComponents({
  pathToSharedCss: '/index.css',
});

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
          <uui-modals></uui-modals>
          
          <story />
        </div>
      `,
    }),
  ],
};

export default preview;