import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/graphql/generated/api/types.js';
import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { LogsService } from './logs.service.js';

@Resolver('Logs')
export class LogsResolver {
  constructor(
    private readonly logsService: LogsService
  ) {}

  @Query()
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.LOGS,
    possession: AuthPossession.ANY,
  })
  async logFiles() {
    return this.logsService.listLogFiles();
  }

  @Query()
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.LOGS,
    possession: AuthPossession.ANY,
  })
  async logFile(@Args('path') path: string, @Args('lines') lines?: number) {
    return this.logsService.getLogFileContent(path, lines);
  }

  @Subscription('logFile')
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
      return originalReturn ? originalReturn.call(asyncIterator) : Promise.resolve({ value: undefined, done: true });
    };
    
    return asyncIterator;
  }
}
