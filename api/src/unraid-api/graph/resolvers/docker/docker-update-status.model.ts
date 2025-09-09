import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

/**
 * Note that these values propagate down to API consumers, so be aware of breaking changes.
 */
export enum UpdateStatus {
    UP_TO_DATE = 'UP_TO_DATE',
    UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
    REBUILD_READY = 'REBUILD_READY',
    UNKNOWN = 'UNKNOWN',
}

registerEnumType(UpdateStatus, {
    name: 'UpdateStatus',
    description: 'Update status of a container.',
});

@ObjectType()
export class ExplicitStatusItem {
    @Field(() => String)
    name!: string;

    @Field(() => UpdateStatus)
    updateStatus!: UpdateStatus;
}
