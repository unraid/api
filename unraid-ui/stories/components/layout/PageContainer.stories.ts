import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { CardWrapper, PageContainer as PageContainerComponent } from '../../../src/components/layout';

const meta = {
  title: 'Components/Layout/PageContainer',
  component: PageContainerComponent,
} satisfies Meta<typeof PageContainerComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PageContainer: Story = {
  render: (args) => ({
    components: { PageContainerComponent, CardWrapper },
    setup() {
      return { args };
    },
    template: `
      <div class="bg-muted/20 p-4">
        <PageContainerComponent v-bind="args">
          <CardWrapper>
            <h3 class="text-lg font-semibold mb-2">Section 1</h3>
            <p>This content is constrained by the PageContainer.</p>
          </CardWrapper>
          <CardWrapper>
            <h3 class="text-lg font-semibold mb-2">Section 2</h3>
            <p>Another section to demonstrate the grid gap.</p>
          </CardWrapper>
        </PageContainerComponent>
      </div>
    `,
  }),
};

export const CustomMaxWidth: Story = {
  args: {
    maxWidth: 'max-w-2xl',
  },
  render: (args) => ({
    components: { PageContainerComponent, CardWrapper },
    setup() {
      return { args };
    },
    template: `
      <div class="bg-muted/20 p-4">
        <PageContainerComponent v-bind="args">
          <CardWrapper>
            <h3 class="text-lg font-semibold mb-2">Narrower Container</h3>
            <p>This container uses a custom max-width value.</p>
          </CardWrapper>
        </PageContainerComponent>
      </div>
    `,
  }),
};
