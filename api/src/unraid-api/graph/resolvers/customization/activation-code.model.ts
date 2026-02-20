import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

import { Language } from '@app/unraid-api/graph/resolvers/info/display/display.model.js';
import { RegistrationState } from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

// Helper function to check if a string is a valid hex color
const isHexColor = (value: string): boolean => /^#([0-9A-F]{3}){1,2}$/i.test(value);

const sanitizeString = (value: any, maxLength?: number): any => {
    if (typeof value === 'string') {
        const sanitized = value.replace(/[\\"']/g, ''); // Remove backslashes, double quotes, and single quotes
        return maxLength ? sanitized.slice(0, maxLength) : sanitized;
    }
    return value;
};

// New transformer for hex colors
const sanitizeAndValidateHexColor = (value: any): string => {
    let sanitized = sanitizeString(value);
    if (typeof sanitized === 'string') {
        // Check if it's a 3 or 6 character hex string without '#'
        if (/^([0-9A-F]{3}){1,2}$/i.test(sanitized)) {
            sanitized = `#${sanitized}`; // Prepend '#'
        }
        // Now validate if it's a standard hex color format
        if (isHexColor(sanitized)) {
            return sanitized;
        }
    }
    return ''; // Return empty string if not a valid hex color after potential modification
};

/**
 * Represents a custom link provided by partners
 */
@ObjectType()
export class PartnerLink {
    @Field(() => String, { description: 'Display title for the link' })
    @IsString()
    @Transform(({ value }) => sanitizeString(value, 100))
    title!: string;

    @Field(() => String, { description: 'The URL' })
    @IsString()
    @IsUrl({}, { message: 'Must be a valid URL' })
    @Transform(({ value }) => sanitizeString(value))
    url!: string;
}

@ObjectType()
export class PartnerConfig {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    name?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    url?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Link to hardware specifications for this system',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    hardwareSpecsUrl?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Link to the system manual/documentation',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    manualUrl?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Link to manufacturer support page',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    supportUrl?: string;

    @Field(() => [PartnerLink], {
        nullable: true,
        description: 'Additional custom links provided by the partner',
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PartnerLink)
    extraLinks?: PartnerLink[];
}

@ObjectType()
export class BrandingConfig {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeAndValidateHexColor(value))
    header?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeAndValidateHexColor(value))
    headermetacolor?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeAndValidateHexColor(value))
    background?: string;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'boolean') return value;
        const sanitized = sanitizeString(value);
        return sanitized === 'yes';
    })
    showBannerGradient?: boolean = true;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsIn(['azure', 'black', 'gray', 'white'])
    @Transform(({ value }) => sanitizeString(value))
    theme?: 'azure' | 'black' | 'gray' | 'white';

    @Field(() => String, {
        nullable: true,
        description: 'Banner image source. Supports local path, remote URL, or data URI/base64.',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    bannerImage?: string | null;

    @Field(() => String, {
        nullable: true,
        description: 'Case model image source. Supports local path, remote URL, or data URI/base64.',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    caseModelImage?: string | null;

    @Field(() => String, {
        nullable: true,
        description:
            'Partner logo source for light themes (azure/white). Supports local path, remote URL, or data URI/base64.',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    partnerLogoLightUrl?: string | null;

    @Field(() => String, {
        nullable: true,
        description:
            'Partner logo source for dark themes (black/gray). Supports local path, remote URL, or data URI/base64.',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    partnerLogoDarkUrl?: string | null;

    @Field(() => Boolean, { nullable: true, description: 'Indicates if a partner logo exists' })
    @IsOptional()
    @IsBoolean()
    hasPartnerLogo?: boolean | null;

    @Field(() => String, { nullable: true, description: 'Custom title for onboarding welcome step' })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    onboardingTitle?: string;

    @Field(() => String, { nullable: true, description: 'Custom subtitle for onboarding welcome step' })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    onboardingSubtitle?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Custom title for fresh install onboarding',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    onboardingTitleFreshInstall?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Custom subtitle for fresh install onboarding',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    onboardingSubtitleFreshInstall?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Custom title for upgrade onboarding',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    onboardingTitleUpgrade?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Custom subtitle for upgrade onboarding',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    onboardingSubtitleUpgrade?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Custom title for downgrade onboarding',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    onboardingTitleDowngrade?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Custom subtitle for downgrade onboarding',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    onboardingSubtitleDowngrade?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Custom title for incomplete onboarding',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    onboardingTitleIncomplete?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Custom subtitle for incomplete onboarding',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    onboardingSubtitleIncomplete?: string;
}

@ObjectType()
export class SystemConfig {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value, 15))
    serverName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    model?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value, 64))
    comment?: string;
}

@ObjectType()
export class PublicPartnerInfo {
    @Field(() => PartnerConfig, { nullable: true })
    partner?: PartnerConfig;

    @Field(() => BrandingConfig, { nullable: true })
    branding?: BrandingConfig;
}

@ObjectType()
export class ActivationCode {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    code?: string;

    @Field(() => PartnerConfig, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => PartnerConfig)
    partner?: PartnerConfig;

    @Field(() => BrandingConfig, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => BrandingConfig)
    branding?: BrandingConfig;

    @Field(() => SystemConfig, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => SystemConfig)
    system?: SystemConfig;
}

@ObjectType()
export class OnboardingState {
    @Field(() => RegistrationState, { nullable: true })
    registrationState?: RegistrationState;

    @Field(() => Boolean, { description: 'Indicates whether the system is registered' })
    isRegistered!: boolean;

    @Field(() => Boolean, { description: 'Indicates whether the system is a fresh install' })
    isFreshInstall!: boolean;

    @Field(() => Boolean, { description: 'Indicates whether an activation code is present' })
    hasActivationCode!: boolean;

    @Field(() => Boolean, {
        description: 'Indicates whether activation is required based on current state',
    })
    activationRequired!: boolean;
}

/**
 * Enum representing the current onboarding status.
 * Used to determine which onboarding flow/UI to show.
 */
export enum OnboardingStatus {
    /** User has not completed onboarding yet */
    INCOMPLETE = 'INCOMPLETE',
    /** User completed onboarding on a previous OS version and has since upgraded */
    UPGRADE = 'UPGRADE',
    /** User completed onboarding on a newer OS version and has since downgraded */
    DOWNGRADE = 'DOWNGRADE',
    /** User has already completed onboarding on the current OS version */
    COMPLETED = 'COMPLETED',
}

registerEnumType(OnboardingStatus, {
    name: 'OnboardingStatus',
    description: 'The current onboarding status based on completion state and version relationship',
});

@ObjectType({
    description: 'Onboarding completion state and context',
})
export class Onboarding {
    @Field(() => OnboardingStatus, {
        description: 'The current onboarding status (INCOMPLETE, UPGRADE, DOWNGRADE, or COMPLETED)',
    })
    status!: OnboardingStatus;

    @Field(() => Boolean, {
        description: 'Whether this is a partner/OEM build with activation code',
    })
    isPartnerBuild!: boolean;

    @Field(() => Boolean, {
        description: 'Whether the onboarding flow has been completed',
    })
    completed!: boolean;

    @Field(() => String, {
        nullable: true,
        description: 'The OS version when onboarding was completed',
    })
    completedAtVersion?: string;

    @Field(() => String, {
        nullable: true,
        description: 'The activation code from the .activationcode file, if present',
    })
    activationCode?: string;

    @Field(() => OnboardingState, {
        description: 'Runtime onboarding state values used by the onboarding flow',
    })
    onboardingState!: OnboardingState;
}

@ObjectType()
export class Customization {
    @Field(() => ActivationCode, { nullable: true })
    activationCode?: ActivationCode;

    @Field(() => Onboarding, { nullable: true })
    onboarding?: Onboarding;

    @Field(() => [Language], { nullable: true })
    availableLanguages?: Language[];
}
