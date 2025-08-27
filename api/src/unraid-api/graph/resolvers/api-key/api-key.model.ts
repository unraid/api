import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { AuthAction, Node, Resource, Role } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { Transform, Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

import { AtLeastOneOf } from '@app/unraid-api/graph/resolvers/validation.utils.js';

@ObjectType()
export class Permission {
    @Field(() => Resource)
    @IsEnum(Resource)
    resource!: Resource;

    @Field(() => [AuthAction], {
        description: 'Actions allowed on this resource',
    })
    @IsArray()
    @IsEnum(AuthAction, { each: true })
    @ArrayMinSize(1)
    actions!: AuthAction[];
}

@ObjectType({ implements: () => Node })
export class ApiKey extends Node {
    @Field()
    @IsString()
    key!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    name!: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    description?: string;

    @Field(() => [Role])
    @IsArray()
    @IsEnum(Role, { each: true })
    roles!: Role[];

    @Field()
    @IsString()
    @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
    createdAt!: string;

    @Field(() => [Permission])
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Permission)
    permissions!: Permission[];
}

@InputType()
export class AddPermissionInput {
    @Field(() => Resource)
    @IsEnum(Resource)
    resource!: Resource;

    @Field(() => [AuthAction])
    @IsArray()
    @IsEnum(AuthAction, { each: true })
    @ArrayMinSize(1)
    actions!: AuthAction[];
}

@InputType()
export class CreateApiKeyInput {
    @Field()
    @IsString()
    name!: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    description?: string;

    @Field(() => [Role], { nullable: true })
    @IsArray()
    @IsEnum(Role, { each: true })
    @IsOptional()
    roles?: Role[];

    @Field(() => [AddPermissionInput], { nullable: true })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AddPermissionInput)
    @IsOptional()
    permissions?: AddPermissionInput[];

    @Field({
        nullable: true,
        description:
            'This will replace the existing key if one already exists with the same name, otherwise returns the existing key',
    })
    @IsBoolean()
    @IsOptional()
    overwrite?: boolean;

    @AtLeastOneOf(['roles', 'permissions'], {
        message: 'At least one role or one permission is required to create an API key.',
    })
    _atLeastOne?: boolean;
}

@InputType()
export class UpdateApiKeyInput {
    @Field(() => PrefixedID)
    @IsString()
    id!: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    name?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    description?: string;

    @Field(() => [Role], { nullable: true })
    @IsArray()
    @IsEnum(Role, { each: true })
    @IsOptional()
    roles?: Role[];

    @Field(() => [AddPermissionInput], { nullable: true })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AddPermissionInput)
    @IsOptional()
    permissions?: AddPermissionInput[];

    @AtLeastOneOf(['roles', 'permissions'], {
        message: 'At least one role or one permission is required to update an API key.',
    })
    _atLeastOne?: boolean;
}

@InputType()
export class AddRoleForApiKeyInput {
    @Field(() => PrefixedID)
    @IsString()
    apiKeyId!: string;

    @Field(() => Role)
    @IsEnum(Role)
    role!: Role;
}

@InputType()
export class RemoveRoleFromApiKeyInput {
    @Field(() => PrefixedID)
    @IsString()
    apiKeyId!: string;

    @Field(() => Role)
    @IsEnum(Role)
    role!: Role;
}

@InputType()
export class DeleteApiKeyInput {
    @Field(() => [PrefixedID])
    @IsArray()
    @IsString({ each: true })
    ids!: string[];
}
