import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

import { plainToInstance, Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    Validate,
    ValidateNested,
    validateSync,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class FanControlSafetyConfig {
    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    min_speed_percent?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    cpu_min_speed_percent?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(150)
    max_temp_before_full?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    fan_failure_threshold?: number;

    @Field(() => [String], {
        nullable: true,
        description:
            'Sensor IDs or names excluded from the critical-temperature check (e.g. known-faulty channels reporting bogus values)',
    })
    @IsString({ each: true })
    @IsOptional()
    ignored_sensors?: string[];
}

@ObjectType()
export class FanCurvePointConfig {
    @Field(() => Float)
    @IsNumber()
    @Min(-50)
    @Max(150)
    temp!: number;

    @Field(() => Float)
    @IsNumber()
    @Min(0)
    @Max(100)
    speed!: number;
}

@ObjectType()
export class FanProfileConfig {
    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    description?: string;

    @Field(() => [FanCurvePointConfig])
    @ValidateNested({ each: true })
    @Type(() => FanCurvePointConfig)
    curve!: FanCurvePointConfig[];
}

@ObjectType()
export class FanZoneConfig {
    @Field(() => [String])
    @IsString({ each: true })
    @ArrayMinSize(1)
    fans!: string[];

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    sensor!: string;

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    profile!: string;
}

@ValidatorConstraint({ name: 'ValidateProfiles', async: false })
class ValidateProfiles implements ValidatorConstraintInterface {
    validate(value: unknown): boolean {
        if (value === null || value === undefined) {
            return true;
        }
        if (typeof value !== 'object' || Array.isArray(value)) {
            return false;
        }
        for (const [, entry] of Object.entries(value as Record<string, unknown>)) {
            const instance = plainToInstance(FanProfileConfig, entry);
            const errors = validateSync(instance);
            if (errors.length > 0) {
                return false;
            }
        }
        return true;
    }

    defaultMessage(): string {
        return 'Each profile must be a valid FanProfileConfig with a curve array of {temp, speed} points';
    }
}

@ValidatorConstraint({ name: 'ValidateUniqueFanIdsAcrossZones', async: false })
class ValidateUniqueFanIdsAcrossZones implements ValidatorConstraintInterface {
    validate(zones: unknown): boolean {
        if (!Array.isArray(zones)) {
            return true;
        }
        const seen = new Set<string>();
        for (const zone of zones) {
            if (!zone || !Array.isArray(zone.fans)) {
                continue;
            }
            for (const fanId of zone.fans as string[]) {
                if (seen.has(fanId)) {
                    return false;
                }
                seen.add(fanId);
            }
        }
        return true;
    }

    defaultMessage(): string {
        return 'A fan ID must not appear in more than one zone';
    }
}

@ObjectType()
export class FanControlConfig {
    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;

    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    control_enabled?: boolean;

    @Field(() => Int, { nullable: true })
    @IsInt()
    @IsOptional()
    @Min(1)
    polling_interval?: number;

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    control_method?: string;

    @Field(() => FanControlSafetyConfig, { nullable: true })
    @ValidateNested()
    @Type(() => FanControlSafetyConfig)
    @IsOptional()
    safety?: FanControlSafetyConfig;

    @Field(() => [FanZoneConfig], {
        nullable: true,
        description: 'Fan zone configurations for automatic curve control',
    })
    @ValidateNested({ each: true })
    @Type(() => FanZoneConfig)
    @Validate(ValidateUniqueFanIdsAcrossZones)
    @IsOptional()
    zones?: FanZoneConfig[];

    @Field(() => GraphQLJSON, { nullable: true, description: 'Custom fan profiles (name -> config)' })
    @Validate(ValidateProfiles)
    @IsOptional()
    profiles?: Record<string, FanProfileConfig>;
}

@InputType()
export class FanControlSafetyInput {
    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    min_speed_percent?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    cpu_min_speed_percent?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(150)
    max_temp_before_full?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    fan_failure_threshold?: number;

    @Field(() => [String], {
        nullable: true,
        description:
            'Sensor IDs or names excluded from the critical-temperature check (e.g. known-faulty channels reporting bogus values)',
    })
    @IsString({ each: true })
    @IsOptional()
    ignored_sensors?: string[];
}

@InputType()
export class FanZoneConfigInput {
    @Field(() => [String], { description: 'Fan IDs in this zone' })
    @IsString({ each: true })
    @ArrayMinSize(1)
    fans!: string[];

    @Field(() => String, { description: 'Temperature sensor ID' })
    @IsString()
    @IsNotEmpty()
    sensor!: string;

    @Field(() => String, { description: 'Profile name to use' })
    @IsString()
    @IsNotEmpty()
    profile!: string;
}

@InputType()
export class UpdateFanControlConfigInput {
    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;

    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    control_enabled?: boolean;

    @Field(() => Int, { nullable: true })
    @IsInt()
    @IsOptional()
    @Min(1)
    polling_interval?: number;

    @Field(() => FanControlSafetyInput, { nullable: true })
    @ValidateNested()
    @Type(() => FanControlSafetyInput)
    @IsOptional()
    safety?: FanControlSafetyInput;

    @Field(() => [FanZoneConfigInput], {
        nullable: true,
        description: 'Zone configurations for automatic curve control',
    })
    @ValidateNested({ each: true })
    @Type(() => FanZoneConfigInput)
    @Validate(ValidateUniqueFanIdsAcrossZones)
    @IsOptional()
    zones?: FanZoneConfigInput[];
}
