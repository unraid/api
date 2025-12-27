import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import {
    SystemTime,
    TimeZoneOption,
    UpdateSystemTimeInput,
} from '@app/unraid-api/graph/resolvers/system-time/system-time.model.js';
import { SystemTimeService } from '@app/unraid-api/graph/resolvers/system-time/system-time.service.js';

@Resolver(() => SystemTime)
export class SystemTimeResolver {
    constructor(private readonly systemTimeService: SystemTimeService) {}

    @Query(() => SystemTime, { description: 'Retrieve current system time configuration' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.VARS,
    })
    async systemTime(): Promise<SystemTime> {
        return this.systemTimeService.getSystemTime();
    }

    @Query(() => [TimeZoneOption], { description: 'Retrieve available time zone options' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    async timeZoneOptions(): Promise<TimeZoneOption[]> {
        return this.systemTimeService.getTimeZoneOptions();
    }

    @Mutation(() => SystemTime, { description: 'Update system time configuration' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async updateSystemTime(@Args('input') input: UpdateSystemTimeInput): Promise<SystemTime> {
        return this.systemTimeService.updateSystemTime(input);
    }
}
