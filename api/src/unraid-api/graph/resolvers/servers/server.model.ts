import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

@ObjectType()
export class ProfileModel {
    @Field(() => ID, { nullable: true })
    userId?: string;

    @Field()
    username!: string;

    @Field()
    url!: string;

    @Field()
    avatar!: string;
}

export enum ServerStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    NEVER_CONNECTED = 'NEVER_CONNECTED',
}

registerEnumType(ServerStatus, {
    name: 'ServerStatus',
});

@ObjectType()
export class Server {
    @Field(() => ProfileModel)
    owner!: ProfileModel;

    @Field()
    guid!: string;

    @Field()
    apikey!: string;

    @Field()
    name!: string;

    @Field(() => ServerStatus)
    status!: ServerStatus;

    @Field()
    wanip!: string;

    @Field()
    lanip!: string;

    @Field()
    localurl!: string;

    @Field()
    remoteurl!: string;
}
