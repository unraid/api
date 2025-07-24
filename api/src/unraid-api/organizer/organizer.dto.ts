import { ObjectType } from '@nestjs/graphql';

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

// Resource definition (global)
@ObjectType()
export class OrganizerResource {
    @IsString()
    id!: string;

    @IsString()
    type!: string; // e.g., "container", "vm", "file", "bookmark"

    @IsString()
    name!: string;

    @IsOptional()
    @IsObject()
    meta?: Record<string, unknown>;
}

// Folder or ref inside a view
@ObjectType()
export class OrganizerFolder {
    @IsString()
    id!: string;

    @IsIn(['folder'])
    type!: 'folder';

    @IsString()
    name!: string;

    @IsArray()
    @IsString({ each: true })
    children!: string[]; // array of entry IDs
}

@ObjectType()
export class OrganizerResourceRef {
    @IsString()
    id!: string;

    @IsIn(['ref'])
    type!: 'ref';

    @IsString()
    target!: string; // resource id
}

// Union type for an entry (for strong typing, not directly used in class-validator)
export type OrganizerEntry = OrganizerFolder | OrganizerResourceRef;

// Each view (user-definable Organizer)
@ObjectType()
export class OrganizerView {
    @IsString()
    id!: string;

    @IsString()
    name!: string;

    @IsString()
    root!: string; // id of the root entry

    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => Object) // we'll validate the values below
    entries!: { [id: string]: OrganizerFolder | OrganizerResourceRef };

    // todo: evolve as needed
    @IsOptional()
    @IsObject()
    prefs?: Record<string, unknown>;
}

// The whole root structure
@ObjectType()
export class OrganizerV1 {
    @IsNumber()
    @Equals(1, { message: 'Version must be 1' })
    version!: 1;

    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => OrganizerResource)
    resources!: { [id: string]: OrganizerResource };

    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => OrganizerView)
    views!: { [id: string]: OrganizerView };
}
