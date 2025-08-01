import { createUnionType, Field, ObjectType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import {
    Equals,
    IsArray,
    IsDefined,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

// Import Docker container type for typing
import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';

// Base resource definition (common fields)
export interface BaseOrganizerResource {
    id: string;
    type: string;
    name: string;
    meta?: unknown;
}

// Generic resource (fallback for unknown types)
@ObjectType()
export class OrganizerResource implements BaseOrganizerResource {
    @Field()
    @IsString()
    id!: string;

    @Field()
    @IsString()
    type!: string; // e.g., "container", "vm", "file", "bookmark"

    @Field()
    @IsString()
    name!: string;

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    @IsObject()
    meta?: Record<string, unknown>;
}

// Container-specific resource with typed meta
@ObjectType()
export class OrganizerContainerResource implements BaseOrganizerResource {
    @Field()
    @IsString()
    id!: string;

    @Field()
    @IsIn(['container'])
    type!: 'container';

    @Field()
    @IsString()
    name!: string;

    @Field(() => DockerContainer, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => DockerContainer)
    meta?: DockerContainer;
}

// Union type for all resource types
export type AnyOrganizerResource = OrganizerContainerResource | OrganizerResource;

// For GraphQL, we need to use a union type
export const AnyOrganizerResource = createUnionType({
    name: 'AnyOrganizerResource',
    types: () => [OrganizerContainerResource, OrganizerResource] as const,
    resolveType(value) {
        if (value.type === 'container') {
            return OrganizerContainerResource;
        }
        return OrganizerResource;
    },
});

// Folder or ref inside a view
@ObjectType()
export class OrganizerFolder {
    @Field()
    @IsString()
    id!: string;

    @Field()
    @IsIn(['folder'])
    type!: 'folder';

    @Field()
    @IsString()
    name!: string;

    @Field(() => [String])
    @IsArray()
    @IsString({ each: true })
    children!: string[]; // array of entry IDs
}

@ObjectType()
export class OrganizerResourceRef {
    @Field()
    @IsString()
    id!: string;

    @Field()
    @IsIn(['ref'])
    type!: 'ref';

    @Field()
    @IsString()
    target!: string; // resource id
}

// Union type for an entry (for strong typing, not directly used in class-validator)
export type OrganizerEntry = OrganizerFolder | OrganizerResourceRef;

// Each view (user-definable Organizer)
@ObjectType()
export class OrganizerView {
    @Field()
    @IsString()
    id!: string;

    @Field()
    @IsString()
    name!: string;

    @Field()
    @IsString()
    root!: string; // id of the root entry

    @Field(() => GraphQLJSON)
    @IsObject()
    entries!: { [id: string]: OrganizerFolder | OrganizerResourceRef };

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    @IsObject()
    prefs?: Record<string, unknown>;
}

// The whole root structure
@ObjectType()
export class OrganizerV1 {
    @Field()
    @IsNumber()
    @Equals(1, { message: 'Version must be 1' })
    version!: 1;

    @Field(() => GraphQLJSON)
    @IsObject()
    resources!: { [id: string]: AnyOrganizerResource };

    @Field(() => GraphQLJSON)
    @IsObject()
    views!: { [id: string]: OrganizerView };
}

// ============================================
// RESOLVED TYPES (for frontend convenience)
// ============================================

// Resolved folder where children are actual objects, not IDs
@ObjectType()
export class ResolvedOrganizerFolder {
    @Field()
    @IsString()
    id!: string;

    @Field()
    @IsIn(['folder'])
    type!: 'folder';

    @Field()
    @IsString()
    name!: string;

    @Field(() => [ResolvedOrganizerEntry])
    @IsArray()
    @ValidateNested({ each: true })
    children!: ResolvedOrganizerEntryType[];
}

// For GraphQL, we need to use a union type
export const ResolvedOrganizerEntry = createUnionType({
    name: 'ResolvedOrganizerEntry',
    types: () => [ResolvedOrganizerFolder, OrganizerContainerResource, OrganizerResource] as const,
    resolveType(value) {
        if (value.type === 'folder') {
            return ResolvedOrganizerFolder;
        }
        if (value.type === 'container') {
            return OrganizerContainerResource;
        }
        return OrganizerResource;
    },
});

// Union type for resolved entries - can be either a resolved folder or a resource
export type ResolvedOrganizerEntryType = ResolvedOrganizerFolder | AnyOrganizerResource;

// Resolved view where root is the actual object, not ID
@ObjectType()
export class ResolvedOrganizerView {
    @Field()
    @IsString()
    id!: string;

    @Field()
    @IsString()
    name!: string;

    @Field(() => ResolvedOrganizerEntry)
    @ValidateNested()
    root!: ResolvedOrganizerEntryType;

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    @IsObject()
    prefs?: Record<string, unknown>;
}

// Resolved organizer structure
@ObjectType()
export class ResolvedOrganizerV1 {
    @Field()
    @IsNumber()
    @Equals(1, { message: 'Version must be 1' })
    version!: 1;

    @Field(() => [ResolvedOrganizerView])
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ResolvedOrganizerView)
    views!: ResolvedOrganizerView[];
}
