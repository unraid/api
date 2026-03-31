import { Field, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsBoolean,
    IsEnum,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Min,
    ValidateNested,
} from 'class-validator';

import {
    OnboardingWizardBootMode,
    OnboardingWizardPoolMode,
    OnboardingWizardStepId,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { Disk } from '@app/unraid-api/graph/resolvers/disks/disks.model.js';
import { RegistrationState } from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

export enum CloseOnboardingReason {
    SAVE_FAILURE = 'SAVE_FAILURE',
}

registerEnumType(CloseOnboardingReason, {
    name: 'CloseOnboardingReason',
    description: 'Optional reason metadata for closing onboarding',
});

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

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    forceOpen?: boolean | null;
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
    bannerImage?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    caseModel?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    caseModelImage?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    partnerLogoLightUrl?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    partnerLogoDarkUrl?: string;

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

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    onboardingTitleFreshInstall?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    onboardingSubtitleFreshInstall?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    onboardingTitleUpgrade?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    onboardingSubtitleUpgrade?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    onboardingTitleDowngrade?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    onboardingSubtitleDowngrade?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    onboardingTitleIncomplete?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    onboardingSubtitleIncomplete?: string;
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

@InputType()
export class OnboardingWizardCoreSettingsDraftInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    serverName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    serverDescription?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    timeZone?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    theme?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    language?: string;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    useSsh?: boolean;
}

@InputType()
export class OnboardingWizardPluginsDraftInput {
    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsString({ each: true })
    selectedIds?: string[];
}

@InputType()
export class OnboardingWizardInternalBootSelectionInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    poolName?: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    slotCount?: number;

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsString({ each: true })
    devices?: string[];

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    bootSizeMiB?: number;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    updateBios?: boolean;

    @Field(() => OnboardingWizardPoolMode, { nullable: true })
    @IsOptional()
    @IsEnum(OnboardingWizardPoolMode)
    poolMode?: OnboardingWizardPoolMode;
}

@InputType()
export class OnboardingWizardInternalBootDraftInput {
    @Field(() => OnboardingWizardBootMode, { nullable: true })
    @IsOptional()
    @IsEnum(OnboardingWizardBootMode)
    bootMode?: OnboardingWizardBootMode;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    skipped?: boolean;

    @Field(() => OnboardingWizardInternalBootSelectionInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => OnboardingWizardInternalBootSelectionInput)
    selection?: OnboardingWizardInternalBootSelectionInput | null;
}

@InputType()
export class OnboardingWizardDraftInput {
    @Field(() => OnboardingWizardCoreSettingsDraftInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => OnboardingWizardCoreSettingsDraftInput)
    coreSettings?: OnboardingWizardCoreSettingsDraftInput;

    @Field(() => OnboardingWizardPluginsDraftInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => OnboardingWizardPluginsDraftInput)
    plugins?: OnboardingWizardPluginsDraftInput;

    @Field(() => OnboardingWizardInternalBootDraftInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => OnboardingWizardInternalBootDraftInput)
    internalBoot?: OnboardingWizardInternalBootDraftInput;
}

@InputType()
export class OnboardingWizardNavigationInput {
    @Field(() => OnboardingWizardStepId, { nullable: true })
    @IsOptional()
    @IsEnum(OnboardingWizardStepId)
    currentStepId?: OnboardingWizardStepId;
}

@InputType()
export class OnboardingWizardInternalBootStateInput {
    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    applyAttempted?: boolean;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    applySucceeded?: boolean;
}

@InputType()
export class SaveOnboardingDraftInput {
    @Field(() => OnboardingWizardDraftInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => OnboardingWizardDraftInput)
    draft?: OnboardingWizardDraftInput;

    @Field(() => OnboardingWizardNavigationInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => OnboardingWizardNavigationInput)
    navigation?: OnboardingWizardNavigationInput;

    @Field(() => OnboardingWizardInternalBootStateInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => OnboardingWizardInternalBootStateInput)
    internalBootState?: OnboardingWizardInternalBootStateInput;
}

@InputType()
export class CloseOnboardingInput {
    @Field(() => CloseOnboardingReason, { nullable: true })
    @IsOptional()
    @IsEnum(CloseOnboardingReason)
    reason?: CloseOnboardingReason;
}

@InputType({
    description: 'Input for creating an internal boot pool during onboarding',
})
export class CreateInternalBootPoolInput {
    @Field(() => String)
    @IsString()
    @Matches(/^[a-z](?:[a-z0-9~._-]*[a-z_-])?$/, {
        message: 'Pool name must match Unraid naming requirements',
    })
    poolName!: string;

    @Field(() => [String])
    @ArrayMinSize(1)
    @ArrayMaxSize(4)
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    devices!: string[];

    @Field(() => Int)
    @IsInt()
    @Min(0)
    bootSizeMiB!: number;

    @Field(() => Boolean)
    @IsBoolean()
    updateBios!: boolean;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    reboot?: boolean;
}

@ObjectType({
    description: 'Result of attempting internal boot pool setup',
})
export class OnboardingInternalBootResult {
    @Field(() => Boolean)
    ok!: boolean;

    @Field(() => Int, { nullable: true })
    code?: number;

    @Field(() => String)
    output!: string;
}

@ObjectType({
    description: 'Warning metadata for an assignable internal boot drive',
})
export class OnboardingInternalBootDriveWarning {
    @Field(() => String)
    diskId!: string;

    @Field(() => String)
    device!: string;

    @Field(() => [String])
    warnings!: string[];
}

@ObjectType({
    description: 'Current onboarding context for configuring internal boot',
})
export class OnboardingInternalBootContext {
    @Field(() => Boolean)
    arrayStopped!: boolean;

    @Field(() => Boolean, { nullable: true })
    bootEligible?: boolean | null;

    @Field(() => Boolean)
    bootedFromFlashWithInternalBootSetup!: boolean;

    @Field(() => String, { nullable: true })
    enableBootTransfer?: string | null;

    @Field(() => [String])
    reservedNames!: string[];

    @Field(() => [String])
    shareNames!: string[];

    @Field(() => [String])
    poolNames!: string[];

    @Field(() => [Disk])
    assignableDisks!: Disk[];

    @Field(() => [OnboardingInternalBootDriveWarning])
    driveWarnings!: OnboardingInternalBootDriveWarning[];
}
