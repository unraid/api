import { Field, InputType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import {
    ActivationCode,
    ActivationOnboardingStepId,
    PublicPartnerInfo,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { RegistrationState } from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

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

@InputType({
    description: 'Activation onboarding step override input',
})
export class ActivationOnboardingStepOverrideInput {
    @Field(() => ActivationOnboardingStepId, {
        description: 'Identifier of the onboarding step',
    })
    @IsEnum(ActivationOnboardingStepId)
    id!: ActivationOnboardingStepId;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    completed?: boolean;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    introducedIn?: string;
}

@InputType({
    description: 'Activation onboarding override input',
})
export class ActivationOnboardingOverrideInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    currentVersion?: string | null;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    previousVersion?: string | null;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    isUpgrade?: boolean;

    @Field(() => [ActivationOnboardingStepOverrideInput], { nullable: true })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ActivationOnboardingStepOverrideInput)
    steps?: ActivationOnboardingStepOverrideInput[];
}

@InputType({
    description: 'Activation code override input',
})
export class ActivationCodeOverrideInput implements Partial<ActivationCode> {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    code?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    partnerName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    partnerUrl?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    serverName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    sysModel?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    comment?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    header?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    headermetacolor?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    background?: string;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    showBannerGradient?: boolean;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @IsIn(['azure', 'black', 'gray', 'white'])
    theme?: 'azure' | 'black' | 'gray' | 'white';
}

@InputType({
    description: 'Partner info override input',
})
export class PartnerInfoOverrideInput implements Partial<PublicPartnerInfo> {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    partnerName?: string | null;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    hasPartnerLogo?: boolean | null;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    partnerUrl?: string | null;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    partnerLogoUrl?: string | null;
}

@InputType({
    description: 'Onboarding override input',
})
export class OnboardingOverrideInput {
    @Field(() => ActivationOnboardingOverrideInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => ActivationOnboardingOverrideInput)
    activationOnboarding?: ActivationOnboardingOverrideInput;

    @Field(() => ActivationCodeOverrideInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => ActivationCodeOverrideInput)
    activationCode?: ActivationCodeOverrideInput | null;

    @Field(() => PartnerInfoOverrideInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => PartnerInfoOverrideInput)
    partnerInfo?: PartnerInfoOverrideInput | null;

    @Field(() => RegistrationState, { nullable: true })
    @IsOptional()
    @IsEnum(RegistrationState)
    registrationState?: RegistrationState;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    isInitialSetup?: boolean;
}
