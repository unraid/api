import { Field, Int, ObjectType } from '@nestjs/graphql';

import { MinigraphStatus } from './my-servers-config.js';

@ObjectType()
export class ApiKeyResponse {
    @Field(() => Boolean)
    valid!: boolean;

    @Field(() => String, { nullable: true })
    error?: string;
}

@ObjectType()
export class MinigraphqlResponse {
    @Field(() => MinigraphStatus)
    status!: MinigraphStatus;

    @Field(() => Int, { nullable: true })
    timeout?: number | null;

    @Field(() => String, { nullable: true })
    error?: string | null;
}

@ObjectType()
export class CloudResponse {
    @Field(() => String)
    status!: string;

    @Field(() => String, { nullable: true })
    ip?: string;

    @Field(() => String, { nullable: true })
    error?: string | null;
}

@ObjectType()
export class RelayResponse {
    @Field(() => String)
    status!: string;

    @Field(() => String, { nullable: true })
    timeout?: string;

    @Field(() => String, { nullable: true })
    error?: string;
}

@ObjectType()
export class Cloud {
    @Field(() => String, { nullable: true })
    error?: string;

    @Field(() => ApiKeyResponse)
    apiKey!: ApiKeyResponse;

    @Field(() => RelayResponse, { nullable: true })
    relay?: RelayResponse;

    @Field(() => MinigraphqlResponse)
    minigraphql!: MinigraphqlResponse;

    @Field(() => CloudResponse)
    cloud!: CloudResponse;

    @Field(() => [String])
    allowedOrigins!: string[];
}
