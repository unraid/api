import { Field, InputType } from '@nestjs/graphql';

@InputType({
    description: 'Input for marking an upgrade onboarding step as completed',
})
export class CompleteUpgradeStepInput {
    @Field(() => String, { description: 'Identifier of the onboarding step to mark completed' })
    stepId!: string;
}
