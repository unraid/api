import { Args, Int, Query, Resolver, Subscription } from '@nestjs/graphql';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@unraid/shared/graphql.model.js';
import { LogFile, LogFileContent } from '@app/unraid-api/graph/resolvers/logs/logs.model.js';
import { LogsService } from '@app/unraid-api/graph/resolvers/logs/logs.service.js';

@Resolver(() => LogFile)
export class LogsResolver {
    constructor(private readonly logsService: LogsService) {}

    @Query(() => [LogFile])
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.LOGS,
        possession: AuthPossession.ANY,
    })
    async logFiles(): Promise<LogFile[]> {
        return this.logsService.listLogFiles();
    }

    @Query(() => LogFileContent)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.LOGS,
        possession: AuthPossession.ANY,
    })
    async logFile(
        @Args('path') path: string,
        @Args('lines', { nullable: true, type: () => Int }) lines?: number,
        @Args('startLine', { nullable: true, type: () => Int }) startLine?: number
    ): Promise<LogFileContent> {
        return this.logsService.getLogFileContent(path, lines, startLine);
    }

    @Subscription(() => LogFileContent, { name: 'logFile' })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.LOGS,
        possession: AuthPossession.ANY,
    })
    async logFileSubscription(@Args('path') path: string) {
        // Start watching the file
        this.logsService.getLogFileSubscriptionChannel(path);

        // Create the async iterator
        const asyncIterator = createSubscription(PUBSUB_CHANNEL.LOG_FILE);

        // Store the original return method to wrap it
        const originalReturn = asyncIterator.return;

        // Override the return method to clean up resources
        asyncIterator.return = async () => {
            // Stop watching the file when subscription ends
            this.logsService.stopWatchingLogFile(path);

            // Call the original return method
            return originalReturn
                ? originalReturn.call(asyncIterator)
                : Promise.resolve({ value: undefined, done: true });
        };

        return asyncIterator;
    }
}
