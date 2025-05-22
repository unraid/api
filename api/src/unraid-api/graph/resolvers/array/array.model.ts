import { Field, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { IsEnum } from 'class-validator';
import { GraphQLBigInt } from 'graphql-scalars';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

@ObjectType()
export class Capacity {
    @Field(() => String, { description: 'Free capacity' })
    free!: string;

    @Field(() => String, { description: 'Used capacity' })
    used!: string;

    @Field(() => String, { description: 'Total capacity' })
    total!: string;
}

@ObjectType()
export class ArrayCapacity {
    @Field(() => Capacity, { description: 'Capacity in kilobytes' })
    kilobytes!: Capacity;

    @Field(() => Capacity, { description: 'Capacity in number of disks' })
    disks!: Capacity;
}

@ObjectType({
    implements: () => Node,
})
export class ArrayDisk extends Node {
    @Field(() => Int, {
        description:
            'Array slot number. Parity1 is always 0 and Parity2 is always 29. Array slots will be 1 - 28. Cache slots are 30 - 53. Flash is 54.',
    })
    idx!: number;

    @Field(() => String, { nullable: true })
    name?: string;

    @Field(() => String, { nullable: true })
    device?: string;

    @Field(() => GraphQLBigInt, { description: '(KB) Disk Size total', nullable: true })
    size?: number | null;

    @Field(() => ArrayDiskStatus, { nullable: true })
    status?: ArrayDiskStatus;

    @Field(() => Boolean, { nullable: true, description: 'Is the disk a HDD or SSD.' })
    rotational?: boolean;

    @Field(() => Int, {
        nullable: true,
        description: 'Disk temp - will be NaN if array is not started or DISK_NP',
    })
    temp?: number | null;

    @Field(() => GraphQLBigInt, {
        nullable: true,
        description:
            'Count of I/O read requests sent to the device I/O drivers. These statistics may be cleared at any time.',
    })
    numReads?: number | null;

    @Field(() => GraphQLBigInt, {
        nullable: true,
        description:
            'Count of I/O writes requests sent to the device I/O drivers. These statistics may be cleared at any time.',
    })
    numWrites?: number | null;

    @Field(() => GraphQLBigInt, {
        nullable: true,
        description:
            'Number of unrecoverable errors reported by the device I/O drivers. Missing data due to unrecoverable array read errors is filled in on-the-fly using parity reconstruct (and we attempt to write this data back to the sector(s) which failed). Any unrecoverable write error results in disabling the disk.',
    })
    numErrors?: number | null;

    @Field(() => GraphQLBigInt, {
        nullable: true,
        description: '(KB) Total Size of the FS (Not present on Parity type drive)',
    })
    fsSize?: number | null;

    @Field(() => GraphQLBigInt, {
        nullable: true,
        description: '(KB) Free Size on the FS (Not present on Parity type drive)',
    })
    fsFree?: number | null;

    @Field(() => GraphQLBigInt, {
        nullable: true,
        description: '(KB) Used Size on the FS (Not present on Parity type drive)',
    })
    fsUsed?: number | null;

    @Field(() => Boolean, { nullable: true })
    exportable?: boolean;

    @Field(() => ArrayDiskType, {
        description: 'Type of Disk - used to differentiate Cache / Flash / Array / Parity',
    })
    type!: ArrayDiskType;

    @Field(() => Int, { nullable: true, description: '(%) Disk space left to warn' })
    warning?: number | null;

    @Field(() => Int, { nullable: true, description: '(%) Disk space left for critical' })
    critical?: number | null;

    @Field(() => String, { nullable: true, description: 'File system type for the disk' })
    fsType?: string | null;

    @Field(() => String, { nullable: true, description: 'User comment on disk' })
    comment?: string | null;

    @Field(() => String, { nullable: true, description: 'File format (ex MBR: 4KiB-aligned)' })
    format?: string | null;

    @Field(() => String, { nullable: true, description: 'ata | nvme | usb | (others)' })
    transport?: string | null;

    @Field(() => ArrayDiskFsColor, { nullable: true })
    color?: ArrayDiskFsColor | null;
}

@ObjectType({
    implements: () => Node,
})
export class UnraidArray extends Node {
    @Field(() => ArrayState, { description: 'Current array state' })
    state!: ArrayState;

    @Field(() => ArrayCapacity, { description: 'Current array capacity' })
    capacity!: ArrayCapacity;

    @Field(() => ArrayDisk, { nullable: true, description: 'Current boot disk' })
    boot?: ArrayDisk;

    @Field(() => [ArrayDisk], { description: 'Parity disks in the current array' })
    parities!: ArrayDisk[];

    @Field(() => [ArrayDisk], { description: 'Data disks in the current array' })
    disks!: ArrayDisk[];

    @Field(() => [ArrayDisk], { description: 'Caches in the current array' })
    caches!: ArrayDisk[];
}

@InputType()
export class ArrayDiskInput {
    @Field(() => PrefixedID, { description: 'Disk ID' })
    id!: string;

    @Field(() => Int, { nullable: true, description: 'The slot for the disk' })
    slot?: number;
}

export enum ArrayStateInputState {
    START = 'START',
    STOP = 'STOP',
}

registerEnumType(ArrayStateInputState, {
    name: 'ArrayStateInputState',
});

@InputType()
export class ArrayStateInput {
    @Field(() => ArrayStateInputState, { description: 'Array state' })
    @IsEnum(ArrayStateInputState)
    desiredState!: ArrayStateInputState;
}

export enum ArrayState {
    STARTED = 'STARTED',
    STOPPED = 'STOPPED',
    NEW_ARRAY = 'NEW_ARRAY',
    RECON_DISK = 'RECON_DISK',
    DISABLE_DISK = 'DISABLE_DISK',
    SWAP_DSBL = 'SWAP_DSBL',
    INVALID_EXPANSION = 'INVALID_EXPANSION',
    PARITY_NOT_BIGGEST = 'PARITY_NOT_BIGGEST',
    TOO_MANY_MISSING_DISKS = 'TOO_MANY_MISSING_DISKS',
    NEW_DISK_TOO_SMALL = 'NEW_DISK_TOO_SMALL',
    NO_DATA_DISKS = 'NO_DATA_DISKS',
}

registerEnumType(ArrayState, {
    name: 'ArrayState',
});

export enum ArrayDiskStatus {
    DISK_NP = 'DISK_NP',
    DISK_OK = 'DISK_OK',
    DISK_NP_MISSING = 'DISK_NP_MISSING',
    DISK_INVALID = 'DISK_INVALID',
    DISK_WRONG = 'DISK_WRONG',
    DISK_DSBL = 'DISK_DSBL',
    DISK_NP_DSBL = 'DISK_NP_DSBL',
    DISK_DSBL_NEW = 'DISK_DSBL_NEW',
    DISK_NEW = 'DISK_NEW',
}

registerEnumType(ArrayDiskStatus, {
    name: 'ArrayDiskStatus',
});

export enum ArrayDiskType {
    DATA = 'DATA',
    PARITY = 'PARITY',
    FLASH = 'FLASH',
    CACHE = 'CACHE',
}

registerEnumType(ArrayDiskType, {
    name: 'ArrayDiskType',
});

export enum ArrayDiskFsColor {
    GREEN_ON = 'GREEN_ON',
    GREEN_BLINK = 'GREEN_BLINK',
    BLUE_ON = 'BLUE_ON',
    BLUE_BLINK = 'BLUE_BLINK',
    YELLOW_ON = 'YELLOW_ON',
    YELLOW_BLINK = 'YELLOW_BLINK',
    RED_ON = 'RED_ON',
    RED_OFF = 'RED_OFF',
    GREY_OFF = 'GREY_OFF',
}

registerEnumType(ArrayDiskFsColor, {
    name: 'ArrayDiskFsColor',
});

@ObjectType({
    implements: () => Node,
})
export class Share extends Node {
    @Field(() => String, { description: 'Display name', nullable: true })
    name?: string | null;

    @Field(() => GraphQLBigInt, { description: '(KB) Free space', nullable: true })
    free?: number | null;

    @Field(() => GraphQLBigInt, { description: '(KB) Used Size', nullable: true })
    used?: number | null;

    @Field(() => GraphQLBigInt, { description: '(KB) Total size', nullable: true })
    size?: number | null;

    @Field(() => [String], { description: 'Disks that are included in this share', nullable: true })
    include?: string[] | null;

    @Field(() => [String], { description: 'Disks that are excluded from this share', nullable: true })
    exclude?: string[] | null;

    @Field(() => Boolean, { description: 'Is this share cached', nullable: true })
    cache?: boolean | null;

    @Field(() => String, { description: 'Original name', nullable: true })
    nameOrig?: string | null;

    @Field(() => String, { description: 'User comment', nullable: true })
    comment?: string | null;

    @Field(() => String, { description: 'Allocator', nullable: true })
    allocator?: string | null;

    @Field(() => String, { description: 'Split level', nullable: true })
    splitLevel?: string | null;

    @Field(() => String, { description: 'Floor', nullable: true })
    floor?: string | null;

    @Field(() => String, { description: 'COW', nullable: true })
    cow?: string | null;

    @Field(() => String, { description: 'Color', nullable: true })
    color?: string | null;

    @Field(() => String, { description: 'LUKS status', nullable: true })
    luksStatus?: string | null;
}
