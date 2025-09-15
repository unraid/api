import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ApiStatusResponse {
    @Field(() => String, { description: 'Raw status output from unraid-api status command' })
    status: string;

    @Field(() => Boolean, { description: 'Whether the API service is currently running' })
    isRunning: boolean;

    @Field(() => String, { description: 'Timestamp of the status check' })
    timestamp: string;
}

@ObjectType()
export class RestartApiResponse {
    @Field(() => Boolean, { description: 'Whether the restart command was successful' })
    success: boolean;

    @Field(() => String, { description: 'Response message from the restart command' })
    message: string;

    @Field(() => String, { nullable: true, description: 'Error message if restart failed' })
    error?: string;

    @Field(() => String, { description: 'Timestamp of the restart attempt' })
    timestamp: string;
}
