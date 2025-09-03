import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
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
        return createSubscription(PUBSUB_CHANNEL.DISPLAY);
    }
}
