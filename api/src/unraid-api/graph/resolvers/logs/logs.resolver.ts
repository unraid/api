import { Args, Int, Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { LogFile, LogFileContent } from '@app/unraid-api/graph/resolvers/logs/logs.model.js';
import { LogsService } from '@app/unraid-api/graph/resolvers/logs/logs.service.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';

@Resolver(() => LogFile)
export class LogsResolver {
    constructor(
        private readonly logsService: LogsService,
        private readonly subscriptionHelper: SubscriptionHelperService
    ) {}

    @Query(() => [LogFile])
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.LOGS,
    })
    async logFiles(): Promise<LogFile[]> {
        return this.logsService.listLogFiles();
    }

    @Query(() => LogFileContent)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.LOGS,
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
        action: AuthAction.READ_ANY,
        resource: Resource.LOGS,
    })
    logFileSubscription(@Args('path') path: string) {
        // Register the topic and get the key
        const topicKey = this.logsService.registerLogFileSubscription(path);

        // Use the helper service to create a tracked subscription
        // This automatically handles subscribe/unsubscribe with reference counting
        return this.subscriptionHelper.createTrackedSubscription(topicKey);
    }
}
