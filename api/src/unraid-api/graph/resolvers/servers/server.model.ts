import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

@ObjectType({ implements: () => Node })
export class ProfileModel extends Node {
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

@ObjectType({ implements: () => Node })
export class Server extends Node {
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
