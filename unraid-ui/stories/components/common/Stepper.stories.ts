import type { Meta, StoryObj } from '@storybook/vue3';
import { Check, Circle, Dot } from 'lucide-vue-next';
import { Button } from '../../../src/components/common/button';
import {
  Stepper as StepperComponent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '../../../src/components/common/stepper';

const meta = {
  title: 'Components/Common',
  component: StepperComponent,
} satisfies Meta<typeof StepperComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Stepper: Story = {
  render: () => ({
    components: {
      StepperComponent,
      StepperItem,
      StepperTitle,
      StepperDescription,
      StepperIndicator,
      StepperSeparator,
      StepperTrigger,
    },
    template: `
      <StepperComponent>
        <template v-for="(step, index) in steps" :key="index">
          <StepperItem :step="index + 1">
            <StepperTrigger>
              <StepperIndicator>{{ index + 1 }}</StepperIndicator>
              <StepperTitle>{{ step.title }}</StepperTitle>
              <StepperDescription>{{ step.description }}</StepperDescription>
            </StepperTrigger>
            <StepperSeparator v-if="index < steps.length - 1" />
          </StepperItem>
        </template>
      </StepperComponent>
    `,
    setup() {
      const steps = [
        { title: 'Account Setup', description: 'Create your account' },
        { title: 'Server Details', description: 'Configure your server' },
        { title: 'Review', description: 'Review and confirm' },
      ];
      return { steps };
    },
  }),
};
