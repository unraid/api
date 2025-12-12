import { Field, InputType } from '@nestjs/graphql';

import { IsEnum } from 'class-validator';

import { ActivationOnboardingStepId } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';

@InputType({
    description: 'Input for marking an upgrade onboarding step as completed',
})
export class CompleteUpgradeStepInput {
    @Field(() => ActivationOnboardingStepId, {
        description: 'Identifier of the onboarding step to mark completed',
    })
    @IsEnum(ActivationOnboardingStepId)
    stepId!: ActivationOnboardingStepId;
}
