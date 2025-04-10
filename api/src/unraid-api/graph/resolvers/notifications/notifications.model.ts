import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

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
    importance?: NotificationImportance;

    @Field(() => NotificationType)
    type!: NotificationType;

    @Field(() => Int)
    offset!: number;

    @Field(() => Int)
    limit!: number;
}

@InputType('NotificationData')
export class NotificationData {
    @Field()
    title!: string;

    @Field()
    subject!: string;

    @Field()
    description!: string;

    @Field(() => NotificationImportance)
    importance!: NotificationImportance;

    @Field({ nullable: true })
    link?: string;
}

@ObjectType('NotificationCounts')
export class NotificationCounts {
    @Field(() => Int)
    info!: number;

    @Field(() => Int)
    warning!: number;

    @Field(() => Int)
    alert!: number;

    @Field(() => Int)
    total!: number;
}

@ObjectType('NotificationOverview')
export class NotificationOverview {
    @Field(() => NotificationCounts)
    unread!: NotificationCounts;

    @Field(() => NotificationCounts)
    archive!: NotificationCounts;
}

@ObjectType('Notification')
export class Notification {
    @Field(() => ID)
    id!: string;

    @Field({ description: "Also known as 'event'" })
    title!: string;

    @Field()
    subject!: string;

    @Field()
    description!: string;

    @Field(() => NotificationImportance)
    importance!: NotificationImportance;

    @Field({ nullable: true })
    link?: string;

    @Field(() => NotificationType)
    type!: NotificationType;

    @Field({ nullable: true, description: 'ISO Timestamp for when the notification occurred' })
    timestamp?: string;

    @Field({ nullable: true })
    formattedTimestamp?: string;
}

@ObjectType('Notifications')
export class Notifications {
    @Field(() => ID)
    id!: string;

    @Field(() => NotificationOverview, {
        description: 'A cached overview of the notifications in the system & their severity.',
    })
    overview!: NotificationOverview;

    @Field(() => [Notification])
    list!: Notification[];
}
