import type { Meta, StoryObj } from '@storybook/vue3';
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
        <StepperItem :step="1">
          <StepperTrigger>
            <StepperIndicator>1</StepperIndicator>
              <StepperTitle>Account Setup</StepperTitle>
            <StepperDescription>Create your account</StepperDescription>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>

        <StepperItem :step="2">
        <StepperTrigger>
          <StepperIndicator>2</StepperIndicator>
            <StepperTitle>Server Details</StepperTitle>
            <StepperDescription>Configure your server</StepperDescription>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>

        <StepperItem :step="3">
          <StepperTrigger>
            <StepperIndicator>3</StepperIndicator>
              <StepperTitle>Review</StepperTitle>
              <StepperDescription>Review and confirm</StepperDescription>
          </StepperTrigger>
        </StepperItem>
      </StepperComponent>
    `,
  }),
};
