import { Field, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export enum NotificationType {
    UNREAD = 'UNREAD',
    ARCHIVE = 'ARCHIVE',
}

export enum NotificationImportance {
    ALERT = 'ALERT',
    INFO = 'INFO',
    WARNING = 'WARNING',
}

// Register enums with GraphQL
registerEnumType(NotificationType, {
    name: 'NotificationType',
});

registerEnumType(NotificationImportance, {
    name: 'NotificationImportance',
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

    // Description is optional in practice (e.g. condition/banner notifications carry
    // their meaning in the title + Active badge). Allow empty so they aren't masked
    // as invalid; the UI hides the line when empty.
    @Field()
    @IsString()
    description!: string;

    @Field(() => NotificationImportance)
    @IsEnum(NotificationImportance)
    @IsNotEmpty()
    importance!: NotificationImportance;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    link?: string;

    @Field({
        nullable: true,
        description:
            'Stable key for a condition-style notification. Raising again with the same key replaces the existing one; clear it with clearNotificationByKey when the condition resolves.',
    })
    @IsString()
    @IsOptional()
    key?: string;

    @Field({
        nullable: true,
        defaultValue: false,
        description:
            'Persistent notifications cannot be archived by the user; they stay until cleared programmatically (typically via their key) when the underlying condition resolves.',
    })
    @IsBoolean()
    @IsOptional()
    persistent?: boolean;
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

    // Description is optional in practice (e.g. condition/banner notifications carry
    // their meaning in the title + Active badge). Allow empty so they aren't masked
    // as invalid; the UI hides the line when empty.
    @Field()
    @IsString()
    description!: string;

    @Field(() => NotificationImportance)
    @IsEnum(NotificationImportance)
    @IsNotEmpty()
    importance!: NotificationImportance;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    link?: string;

    @Field({
        nullable: true,
        description: 'Stable key for condition-style notifications (idempotent raise / clear-by-key).',
    })
    @IsString()
    @IsOptional()
    key?: string;

    @Field({
        description:
            'Whether this notification persists until its condition is resolved. Persistent notifications are not user-archivable.',
    })
    @IsBoolean()
    persistent!: boolean;

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

    @Field(() => [Notification], {
        description: 'Deduplicated list of unread warning and alert notifications, sorted latest first.',
    })
    @IsNotEmpty()
    warningsAndAlerts!: Notification[];
}
