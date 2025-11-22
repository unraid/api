import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export enum NotificationType {
    UNREAD = 'UNREAD',
    ARCHIVE = 'ARCHIVE',
}

export enum NotificationImportance {
    ALERT = 'ALERT',
    INFO = 'INFO',
    WARNING = 'WARNING',
}

export enum NotificationJobState {
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
}

export enum NotificationJobOperation {
    ARCHIVE_ALL = 'ARCHIVE_ALL',
    DELETE = 'DELETE',
}

// Register enums with GraphQL
registerEnumType(NotificationType, {
    name: 'NotificationType',
});

registerEnumType(NotificationImportance, {
    name: 'NotificationImportance',
});

registerEnumType(NotificationJobState, {
    name: 'NotificationJobState',
});

registerEnumType(NotificationJobOperation, {
    name: 'NotificationJobOperation',
});

@InputType('NotificationFilter')
export class NotificationFilter {
    @Field(() => NotificationImportance, { nullable: true })
    @IsEnum(NotificationImportance)
    @IsOptional()
    importance?: NotificationImportance;

    @Field(() => NotificationType)
    @IsEnum(NotificationType)
    @IsNotEmpty()
    type!: NotificationType;

    @Field(() => Int)
    @IsInt()
    @Min(0)
    @IsNotEmpty()
    offset!: number;

    @Field(() => Int)
    @IsInt()
    @Min(1)
    @IsNotEmpty()
    limit!: number;
}

@InputType('NotificationData')
export class NotificationData {
    @Field()
    @IsString()
    @IsNotEmpty()
    title!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    subject!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    description!: string;

    @Field(() => NotificationImportance)
    @IsEnum(NotificationImportance)
    @IsNotEmpty()
    importance!: NotificationImportance;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    link?: string;
}

@ObjectType('NotificationCounts')
export class NotificationCounts {
    @Field(() => Int)
    @IsInt()
    @Min(0)
    info!: number;

    @Field(() => Int)
    @IsInt()
    @Min(0)
    warning!: number;

    @Field(() => Int)
    @IsInt()
    @Min(0)
    alert!: number;

    @Field(() => Int)
    @IsInt()
    @Min(0)
    total!: number;
}

@ObjectType('NotificationOverview')
export class NotificationOverview {
    @Field(() => NotificationCounts)
    @IsNotEmpty()
    unread!: NotificationCounts;

    @Field(() => NotificationCounts)
    @IsNotEmpty()
    archive!: NotificationCounts;
}

@ObjectType({ implements: () => Node })
export class Notification extends Node {
    @Field({ description: "Also known as 'event'" })
    @IsString()
    @IsNotEmpty()
    title!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    subject!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    description!: string;

    @Field(() => NotificationImportance)
    @IsEnum(NotificationImportance)
    @IsNotEmpty()
    importance!: NotificationImportance;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    link?: string;

    @Field(() => NotificationType)
    @IsEnum(NotificationType)
    @IsNotEmpty()
    type!: NotificationType;

    @Field({ nullable: true, description: 'ISO Timestamp for when the notification occurred' })
    @IsString()
    @IsOptional()
    timestamp?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    formattedTimestamp?: string;
}

@ObjectType({ implements: () => Node })
export class Notifications extends Node {
    @Field(() => NotificationOverview, {
        description: 'A cached overview of the notifications in the system & their severity.',
    })
    @IsNotEmpty()
    overview!: NotificationOverview;

    @Field(() => [Notification])
    @IsNotEmpty()
    list!: Notification[];

    @Field(() => NotificationJob, { nullable: true })
    job?: NotificationJob;
}

@ObjectType()
export class NotificationJob {
    @Field(() => ID)
    id!: string;

    @Field(() => NotificationJobOperation)
    operation!: NotificationJobOperation;

    @Field(() => NotificationJobState)
    state!: NotificationJobState;

    @Field(() => Int)
    processed!: number;

    @Field(() => Int)
    total!: number;

    @Field({ nullable: true })
    error?: string | null;
}

