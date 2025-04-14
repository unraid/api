import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export enum DiskFsType {
    XFS = 'XFS',
    BTRFS = 'BTRFS',
    VFAT = 'VFAT',
    ZFS = 'ZFS',
    EXT4 = 'EXT4',
    NTFS = 'NTFS',
}

registerEnumType(DiskFsType, {
    name: 'DiskFsType',
    description: 'The type of filesystem on the disk partition',
});

export enum DiskInterfaceType {
    SAS = 'SAS',
    SATA = 'SATA',
    USB = 'USB',
    PCIE = 'PCIE',
    UNKNOWN = 'UNKNOWN',
}

registerEnumType(DiskInterfaceType, {
    name: 'DiskInterfaceType',
    description: 'The type of interface the disk uses to connect to the system',
});

export enum DiskSmartStatus {
    OK = 'OK',
    UNKNOWN = 'UNKNOWN',
}

registerEnumType(DiskSmartStatus, {
    name: 'DiskSmartStatus',
    description: 'The SMART (Self-Monitoring, Analysis and Reporting Technology) status of the disk',
});

@ObjectType()
export class DiskPartition {
    @Field(() => String, { description: 'The name of the partition' })
    @IsString()
    name!: string;

    @Field(() => DiskFsType, { description: 'The filesystem type of the partition' })
    @IsEnum(DiskFsType)
    fsType!: DiskFsType;

    @Field(() => Number, { description: 'The size of the partition in bytes' })
    @IsNumber()
    size!: number;
}

@ObjectType({ implements: () => Node })
export class Disk implements Node {
    @Field(() => PrefixedID, { description: 'The unique identifier of the disk' })
    @IsString()
    id!: string;

    @Field(() => String, { description: 'The device path of the disk (e.g. /dev/sdb)' })
    @IsString()
    device!: string;

    @Field(() => String, { description: 'The type of disk (e.g. SSD, HDD)' })
    @IsString()
    type!: string;

    @Field(() => String, { description: 'The model name of the disk' })
    @IsString()
    name!: string;

    @Field(() => String, { description: 'The manufacturer of the disk' })
    @IsString()
    vendor!: string;

    @Field(() => Number, { description: 'The total size of the disk in bytes' })
    @IsNumber()
    size!: number;

    @Field(() => Number, { description: 'The number of bytes per sector' })
    @IsNumber()
    bytesPerSector!: number;

    @Field(() => Number, { description: 'The total number of cylinders on the disk' })
    @IsNumber()
    totalCylinders!: number;

    @Field(() => Number, { description: 'The total number of heads on the disk' })
    @IsNumber()
    totalHeads!: number;

    @Field(() => Number, { description: 'The total number of sectors on the disk' })
    @IsNumber()
    totalSectors!: number;

    @Field(() => Number, { description: 'The total number of tracks on the disk' })
    @IsNumber()
    totalTracks!: number;

    @Field(() => Number, { description: 'The number of tracks per cylinder' })
    @IsNumber()
    tracksPerCylinder!: number;

    @Field(() => Number, { description: 'The number of sectors per track' })
    @IsNumber()
    sectorsPerTrack!: number;

    @Field(() => String, { description: 'The firmware revision of the disk' })
    @IsString()
    firmwareRevision!: string;

    @Field(() => String, { description: 'The serial number of the disk' })
    @IsString()
    serialNum!: string;

    @Field(() => DiskInterfaceType, { description: 'The interface type of the disk' })
    @IsEnum(DiskInterfaceType)
    interfaceType!: DiskInterfaceType;

    @Field(() => DiskSmartStatus, { description: 'The SMART status of the disk' })
    @IsEnum(DiskSmartStatus)
    smartStatus!: DiskSmartStatus;

    @Field(() => Number, {
        description: 'The current temperature of the disk in Celsius',
        nullable: true,
    })
    @IsOptional()
    @IsNumber()
    temperature?: number;

    @Field(() => [DiskPartition], { description: 'The partitions on the disk' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DiskPartition)
    partitions!: DiskPartition[];
}
