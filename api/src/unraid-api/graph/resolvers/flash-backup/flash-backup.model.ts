import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class InitiateFlashBackupInput {
    @Field(() => String, { description: 'The name of the remote configuration to use for the backup.' })
    remoteName!: string;

    @Field(() => String, { description: 'Source path to backup (typically the flash drive).' })
    sourcePath!: string;

    @Field(() => String, { description: 'Destination path on the remote.' })
    destinationPath!: string;

    @Field(() => GraphQLJSON, {
        description: 'Additional options for the backup operation, such as --dry-run or --transfers.',
        nullable: true,
    })
    options?: Record<string, unknown>;
}

@ObjectType()
export class FlashBackupStatus {
    @Field(() => String, {
        description: 'Status message indicating the outcome of the backup initiation.',
    })
    status!: string;

    @Field(() => String, {
        description: 'Job ID if available, can be used to check job status.',
        nullable: true,
    })
    jobId?: string;
}

@ObjectType()
export class FlashBackupJob {
    @Field(() => String, { description: 'Job ID' })
    id!: string;

    @Field(() => String, { description: 'Job type (e.g., sync/copy)' })
    type!: string;

    @Field(() => GraphQLJSON, { description: 'Job status and statistics' })
    stats!: Record<string, unknown>;
}

@ObjectType()
export class RCloneWebGuiInfo {
    @Field()
    url!: string;
}
