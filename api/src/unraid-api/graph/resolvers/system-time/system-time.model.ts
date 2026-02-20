import { Field, InputType, ObjectType } from '@nestjs/graphql';

import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    ValidateIf,
} from 'class-validator';

const MANUAL_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

@ObjectType({ description: 'System time configuration and current status' })
export class SystemTime {
    @Field({ description: 'Current server time in ISO-8601 format (UTC)' })
    currentTime!: string;

    @Field({ description: 'IANA timezone identifier currently in use' })
    timeZone!: string;

    @Field({ description: 'Whether NTP/PTP time synchronization is enabled' })
    useNtp!: boolean;

    @Field(() => [String], {
        description: 'Configured NTP servers (empty strings indicate unused slots)',
    })
    ntpServers!: string[];
}

@ObjectType({ description: 'Selectable timezone option from the system list' })
export class TimeZoneOption {
    @Field({ description: 'IANA timezone identifier' })
    value!: string;

    @Field({ description: 'Display label for the timezone' })
    label!: string;
}

@InputType()
export class UpdateSystemTimeInput {
    @Field({ nullable: true, description: 'New IANA timezone identifier to apply' })
    @IsOptional()
    @IsString()
    timeZone?: string;

    @Field({ nullable: true, description: 'Enable or disable NTP-based synchronization' })
    @IsOptional()
    @IsBoolean()
    useNtp?: boolean;

    @Field(() => [String], {
        nullable: true,
        description: 'Ordered list of up to four NTP servers. Supply empty strings to clear positions.',
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(4)
    @IsString({ each: true })
    ntpServers?: string[];

    @Field({
        nullable: true,
        description: 'Manual date/time to apply when disabling NTP, expected format YYYY-MM-DD HH:mm:ss',
    })
    @ValidateIf((input: UpdateSystemTimeInput) => input.useNtp === false)
    @IsNotEmpty({ message: 'manualDateTime is required when useNtp is false' })
    @IsString()
    @Matches(MANUAL_TIME_PATTERN, {
        message: 'manualDateTime must be formatted as YYYY-MM-DD HH:mm:ss',
    })
    manualDateTime?: string;
}

export const MANUAL_TIME_REGEX = MANUAL_TIME_PATTERN;
