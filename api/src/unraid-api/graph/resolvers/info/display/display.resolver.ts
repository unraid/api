import { Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { CachedResolverBase } from '@app/unraid-api/graph/resolvers/base/cached-resolver.base.js';
import {
    InfoDisplay,
    InfoDisplayCase,
} from '@app/unraid-api/graph/resolvers/info/display/display.model.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';

@Resolver(() => InfoDisplay)
export class InfoDisplayResolver extends CachedResolverBase<InfoDisplay> {
    constructor(private readonly displayService: DisplayService) {
        super();
    }

    // Implementation of abstract methods from CachedResolverBase
    protected getPromiseCacheKey(): string {
        return '_displayPromise';
    }

    protected hasData(parent: Partial<InfoDisplay>): boolean {
        // Check if we have display-specific data
        return parent.theme !== undefined;
    }

    protected fetchData(): Promise<InfoDisplay> {
        return this.displayService.generateDisplay();
    }

    // Query for the root display field (backward compatibility)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DISPLAY,
        possession: AuthPossession.ANY,
    })
    @Query(() => InfoDisplay, { name: 'display' })
    public async display(): Promise<InfoDisplay> {
        return this.displayService.generateDisplay();
    }

    // Subscription for display updates
    @Subscription(() => InfoDisplay, { name: 'displaySubscription' })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DISPLAY,
        possession: AuthPossession.ANY,
    })
    public async displaySubscription() {
        return createSubscription(PUBSUB_CHANNEL.DISPLAY);
    }

    @ResolveField(() => InfoDisplayCase)
    public async case(parent: Partial<InfoDisplay>): Promise<InfoDisplayCase> {
        const display = await this.getCachedData(parent);
        return display.case;
    }

    @ResolveField(() => String)
    public async theme(parent: Partial<InfoDisplay>): Promise<string> {
        const display = await this.getCachedData(parent);
        return display.theme;
    }

    @ResolveField(() => String)
    public async unit(parent: Partial<InfoDisplay>): Promise<string> {
        const display = await this.getCachedData(parent);
        return display.unit;
    }

    @ResolveField(() => Boolean)
    public async scale(parent: Partial<InfoDisplay>): Promise<boolean> {
        const display = await this.getCachedData(parent);
        return display.scale;
    }

    @ResolveField(() => Boolean)
    public async tabs(parent: Partial<InfoDisplay>): Promise<boolean> {
        const display = await this.getCachedData(parent);
        return display.tabs;
    }

    @ResolveField(() => Boolean)
    public async resize(parent: Partial<InfoDisplay>): Promise<boolean> {
        const display = await this.getCachedData(parent);
        return display.resize;
    }

    @ResolveField(() => Boolean)
    public async wwn(parent: Partial<InfoDisplay>): Promise<boolean> {
        const display = await this.getCachedData(parent);
        return display.wwn;
    }

    @ResolveField(() => Boolean)
    public async total(parent: Partial<InfoDisplay>): Promise<boolean> {
        const display = await this.getCachedData(parent);
        return display.total;
    }

    @ResolveField(() => Boolean)
    public async usage(parent: Partial<InfoDisplay>): Promise<boolean> {
        const display = await this.getCachedData(parent);
        return display.usage;
    }

    @ResolveField(() => Boolean)
    public async text(parent: Partial<InfoDisplay>): Promise<boolean> {
        const display = await this.getCachedData(parent);
        return display.text;
    }

    @ResolveField(() => Number)
    public async warning(parent: Partial<InfoDisplay>): Promise<number> {
        const display = await this.getCachedData(parent);
        return display.warning;
    }

    @ResolveField(() => Number)
    public async critical(parent: Partial<InfoDisplay>): Promise<number> {
        const display = await this.getCachedData(parent);
        return display.critical;
    }

    @ResolveField(() => Number)
    public async hot(parent: Partial<InfoDisplay>): Promise<number> {
        const display = await this.getCachedData(parent);
        return display.hot;
    }

    @ResolveField(() => Number, { nullable: true })
    public async max(parent: Partial<InfoDisplay>): Promise<number | undefined> {
        const display = await this.getCachedData(parent);
        return display.max;
    }

    @ResolveField(() => String, { nullable: true })
    public async locale(parent: Partial<InfoDisplay>): Promise<string | undefined> {
        const display = await this.getCachedData(parent);
        return display.locale;
    }
}
