import { Field, ObjectType } from '@nestjs/graphql';

import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

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

@ObjectType()
export class PublicPartnerInfo {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    partnerName?: string;

    @Field(() => Boolean, { description: 'Indicates if a partner logo exists' })
    @IsBoolean()
    hasPartnerLogo?: boolean;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    partnerUrl?: string;

    @Field(() => String, {
        nullable: true,
        description:
            'The path to the partner logo image on the flash drive, relative to the activation code file',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    partnerLogoUrl?: string;
}

@ObjectType()
export class ActivationCode {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    code?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    partnerName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    partnerUrl?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value, 15))
    serverName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    sysModel?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    comment?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString() // Keep IsString to ensure it's a string after transformation
    @Transform(({ value }) => sanitizeAndValidateHexColor(value))
    header?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString() // Keep IsString
    @Transform(({ value }) => sanitizeAndValidateHexColor(value))
    headermetacolor?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString() // Keep IsString
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
}

@ObjectType()
export class Customization {
    @Field(() => ActivationCode, { nullable: true })
    activationCode?: ActivationCode;

    @Field(() => PublicPartnerInfo, { nullable: true })
    partnerInfo?: PublicPartnerInfo;
}
