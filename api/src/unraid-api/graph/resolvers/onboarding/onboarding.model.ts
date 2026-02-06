import { Field, InputType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { RegistrationState } from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

@InputType({
    description: 'Onboarding completion override input',
})
export class OnboardingOverrideCompletionInput {
    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    completed?: boolean;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    completedAtVersion?: string | null;
}

@InputType({
    description: 'Partner link input for custom links',
})
export class PartnerLinkInput {
    @Field(() => String)
    @IsString()
    title!: string;

    @Field(() => String)
    @IsString()
    url!: string;
}

@InputType()
export class PartnerConfigInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    name?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    url?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    hardwareSpecsUrl?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    manualUrl?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    supportUrl?: string;

    @Field(() => [PartnerLinkInput], { nullable: true })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PartnerLinkInput)
    extraLinks?: PartnerLinkInput[];
}

@InputType()
export class BrandingConfigInput {
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

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    logoUrl?: string;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    hasPartnerLogo?: boolean;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    onboardingTitle?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    onboardingSubtitle?: string;
}

@InputType()
export class SystemConfigInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    serverName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    model?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    comment?: string;
}

@InputType({
    description: 'Activation code override input',
})
export class ActivationCodeOverrideInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    code?: string;

    @Field(() => PartnerConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => PartnerConfigInput)
    partner?: PartnerConfigInput;

    @Field(() => BrandingConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => BrandingConfigInput)
    branding?: BrandingConfigInput;

    @Field(() => SystemConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => SystemConfigInput)
    system?: SystemConfigInput;
}

@InputType({
    description: 'Partner info override input',
})
export class PartnerInfoOverrideInput {
    @Field(() => PartnerConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => PartnerConfigInput)
    partner?: PartnerConfigInput;

    @Field(() => BrandingConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => BrandingConfigInput)
    branding?: BrandingConfigInput;
}

@InputType({
    description: 'Onboarding override input for testing',
})
export class OnboardingOverrideInput {
    @Field(() => OnboardingOverrideCompletionInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => OnboardingOverrideCompletionInput)
    onboarding?: OnboardingOverrideCompletionInput;

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
}
