import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long.js';
import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

@ObjectType()
export class Capacity {
    @Field(() => String, { description: 'Free capacity' })
    free: string = '';

    @Field(() => String, { description: 'Used capacity' })
    used: string = '';

    @Field(() => String, { description: 'Total capacity' })
    total: string = '';
}

@ObjectType()
export class ArrayCapacity {
    @Field(() => Capacity, { description: 'Capacity in kilobytes' })
    kilobytes: Capacity = new Capacity();

    @Field(() => Capacity, { description: 'Capacity in number of disks' })
    disks: Capacity = new Capacity();
}

@ObjectType()
export class ArrayDisk {
    @Field(() => ID, { description: 'Disk identifier, only set for present disks on the system' })
    id: string = '';

    @Field(() => Int, {
        description:
            'Array slot number. Parity1 is always 0 and Parity2 is always 29. Array slots will be 1 - 28. Cache slots are 30 - 53. Flash is 54.',
    })
    idx: number = 0;

    @Field(() => String, { nullable: true })
    name?: string;

    @Field(() => String, { nullable: true })
    device?: string;

    @Field(() => Float, { description: '(KB) Disk Size total' })
    size: number = 0;

    @Field(() => ArrayDiskStatus, { nullable: true })
    status?: ArrayDiskStatus;

    @Field(() => Boolean, { nullable: true, description: 'Is the disk a HDD or SSD.' })
    rotational?: boolean;

    @Field(() => Int, {
        nullable: true,
        description: 'Disk temp - will be NaN if array is not started or DISK_NP',
    })
    temp?: number | null;

    @Field(() => Float, {
        description:
            'Count of I/O read requests sent to the device I/O drivers. These statistics may be cleared at any time.',
    })
    numReads: number = 0;

    @Field(() => Float, {
        description:
            'Count of I/O writes requests sent to the device I/O drivers. These statistics may be cleared at any time.',
    })
    numWrites: number = 0;

    @Field(() => Float, {
        description:
            'Number of unrecoverable errors reported by the device I/O drivers. Missing data due to unrecoverable array read errors is filled in on-the-fly using parity reconstruct (and we attempt to write this data back to the sector(s) which failed). Any unrecoverable write error results in disabling the disk.',
    })
    numErrors: number = 0;

    @Field(() => Float, {
        nullable: true,
        description: '(KB) Total Size of the FS (Not present on Parity type drive)',
    })
    fsSize?: number | null;

    @Field(() => Float, {
        nullable: true,
        description: '(KB) Free Size on the FS (Not present on Parity type drive)',
    })
    fsFree?: number | null;

    @Field(() => Float, {
        nullable: true,
        description: '(KB) Used Size on the FS (Not present on Parity type drive)',
    })
    fsUsed?: number | null;

    @Field(() => Boolean, { nullable: true })
    exportable?: boolean;

    @Field(() => ArrayDiskType, {
        description: 'Type of Disk - used to differentiate Cache / Flash / Array / Parity',
    })
    type: ArrayDiskType = ArrayDiskType.DATA;

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

@ObjectType()
export class UnraidArray implements Node {
    @Field(() => ID)
    id: string = '';

    @Field(() => ArrayState, { nullable: true, description: 'Array state before this query/mutation' })
    previousState?: ArrayState;

    @Field(() => ArrayPendingState, {
        nullable: true,
        description: 'Array state after this query/mutation',
    })
    pendingState?: ArrayPendingState;

    @Field(() => ArrayState, { description: 'Current array state' })
    state: ArrayState = ArrayState.STOPPED;

    @Field(() => ArrayCapacity, { description: 'Current array capacity' })
    capacity: ArrayCapacity = new ArrayCapacity();

    @Field(() => ArrayDisk, { nullable: true, description: 'Current boot disk' })
    boot?: ArrayDisk;

    @Field(() => [ArrayDisk], { description: 'Parity disks in the current array' })
    parities: ArrayDisk[] = [];

    @Field(() => [ArrayDisk], { description: 'Data disks in the current array' })
    disks: ArrayDisk[] = [];

    @Field(() => [ArrayDisk], { description: 'Caches in the current array' })
    caches: ArrayDisk[] = [];
}

@InputType()
export class ArrayDiskInput {
    @Field(() => ID, { description: 'Disk ID' })
    id: string = '';

    @Field(() => Int, { nullable: true, description: 'The slot for the disk' })
    slot?: number;
}

@InputType()
export class ArrayStateInput {
    @Field(() => ArrayStateInputState, { description: 'Array state' })
    desiredState: ArrayStateInputState = ArrayStateInputState.STOP;
}

@ObjectType()
export class ArrayMutations {
    @Field(() => UnraidArray, { nullable: true, description: 'Set array state' })
    setState?: (input: ArrayStateInput) => Promise<UnraidArray>;

    @Field(() => UnraidArray, { nullable: true, description: 'Add new disk to array' })
    addDiskToArray?: (input: ArrayDiskInput) => Promise<UnraidArray>;

    @Field(() => UnraidArray, {
        nullable: true,
        description:
            "Remove existing disk from array. NOTE: The array must be stopped before running this otherwise it'll throw an error.",
    })
    removeDiskFromArray?: (input: ArrayDiskInput) => Promise<UnraidArray>;

    @Field(() => ArrayDisk, { nullable: true })
    mountArrayDisk?: (id: string) => Promise<ArrayDisk>;

    @Field(() => ArrayDisk, { nullable: true })
    unmountArrayDisk?: (id: string) => Promise<ArrayDisk>;

    @Field(() => Object, { nullable: true })
    clearArrayDiskStatistics?: (id: string) => Promise<any>;
}

export enum ArrayStateInputState {
    START = 'START',
    STOP = 'STOP',
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

export enum ArrayPendingState {
    STARTING = 'STARTING',
    STOPPING = 'STOPPING',
    NO_DATA_DISKS = 'NO_DATA_DISKS',
    TOO_MANY_MISSING_DISKS = 'TOO_MANY_MISSING_DISKS',
}

export enum ArrayDiskType {
    DATA = 'DATA',
    PARITY = 'PARITY',
    FLASH = 'FLASH',
    CACHE = 'CACHE',
}

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

@ObjectType()
export class Share implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String, { description: 'Display name', nullable: true })
    name?: string | null;

    @Field(() => GraphQLLong, { description: '(KB) Free space', nullable: true })
    free?: number | null;

    @Field(() => GraphQLLong, { description: '(KB) Used Size', nullable: true })
    used?: number | null;

    @Field(() => GraphQLLong, { description: '(KB) Total size', nullable: true })
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
