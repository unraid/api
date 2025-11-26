import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { GRAPHQL_PUBSUB_CHANNEL } from '@unraid/shared/pubsub/graphql.pubsub.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { createSubscription } from '@app/core/pubsub.js';
import { Display } from '@app/unraid-api/graph/resolvers/info/display/display.model.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';

@Resolver(() => Display)
export class DisplayResolver {
    constructor(private readonly displayService: DisplayService) {}

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DISPLAY,
    })
    @Query(() => Display)
    public async display(): Promise<Display> {
        return this.displayService.generateDisplay();
    }

    @Subscription(() => Display)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DISPLAY,
    })
    public async displaySubscription() {
        return createSubscription(GRAPHQL_PUBSUB_CHANNEL.DISPLAY);
    }
}
