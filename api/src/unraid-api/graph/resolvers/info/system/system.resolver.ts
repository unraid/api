import { ResolveField, Resolver } from '@nestjs/graphql';

import { baseboard as getBaseboard, system as getSystem } from 'systeminformation';

import { CachedResolverBase } from '@app/unraid-api/graph/resolvers/base/cached-resolver.base.js';
import { InfoBaseboard, InfoSystem } from '@app/unraid-api/graph/resolvers/info/system/system.model.js';

@Resolver(() => InfoSystem)
export class SystemResolver extends CachedResolverBase<InfoSystem> {
    // Implementation of abstract methods from CachedResolverBase
    protected getPromiseCacheKey(): string {
        return '_systemPromise';
    }

    protected hasData(parent: Partial<InfoSystem>): boolean {
        // Check if we have system-specific data
        return parent.manufacturer !== undefined;
    }

    protected async fetchData(): Promise<InfoSystem> {
        const system = await getSystem();
        return { id: 'info/system', ...system } as InfoSystem;
    }

    @ResolveField(() => String, { nullable: true })
    public async manufacturer(parent: Partial<InfoSystem>): Promise<string | undefined> {
        const system = await this.getCachedData(parent);
        return system.manufacturer;
    }

    @ResolveField(() => String, { nullable: true })
    public async model(parent: Partial<InfoSystem>): Promise<string | undefined> {
        const system = await this.getCachedData(parent);
        return system.model;
    }

    @ResolveField(() => String, { nullable: true })
    public async version(parent: Partial<InfoSystem>): Promise<string | undefined> {
        const system = await this.getCachedData(parent);
        return system.version;
    }

    @ResolveField(() => String, { nullable: true })
    public async serial(parent: Partial<InfoSystem>): Promise<string | undefined> {
        const system = await this.getCachedData(parent);
        return system.serial;
    }

    @ResolveField(() => String, { nullable: true })
    public async uuid(parent: Partial<InfoSystem>): Promise<string | undefined> {
        const system = await this.getCachedData(parent);
        return system.uuid;
    }

    @ResolveField(() => String, { nullable: true })
    public async sku(parent: Partial<InfoSystem>): Promise<string | undefined> {
        const system = await this.getCachedData(parent);
        return system.sku;
    }

    @ResolveField(() => Boolean, { nullable: true })
    public async virtual(parent: Partial<InfoSystem>): Promise<boolean | undefined> {
        const system = await this.getCachedData(parent);
        return system.virtual;
    }
}

@Resolver(() => InfoBaseboard)
export class BaseboardResolver extends CachedResolverBase<InfoBaseboard> {
    // Implementation of abstract methods from CachedResolverBase
    protected getPromiseCacheKey(): string {
        return '_baseboardPromise';
    }

    protected hasData(parent: Partial<InfoBaseboard>): boolean {
        // Check if we have baseboard-specific data
        return parent.manufacturer !== undefined;
    }

    protected async fetchData(): Promise<InfoBaseboard> {
        const baseboard = await getBaseboard();
        return { id: 'info/baseboard', ...baseboard } as InfoBaseboard;
    }

    @ResolveField(() => String, { nullable: true })
    public async manufacturer(parent: Partial<InfoBaseboard>): Promise<string | undefined> {
        const baseboard = await this.getCachedData(parent);
        return baseboard.manufacturer;
    }

    @ResolveField(() => String, { nullable: true })
    public async model(parent: Partial<InfoBaseboard>): Promise<string | undefined> {
        const baseboard = await this.getCachedData(parent);
        return baseboard.model;
    }

    @ResolveField(() => String, { nullable: true })
    public async version(parent: Partial<InfoBaseboard>): Promise<string | undefined> {
        const baseboard = await this.getCachedData(parent);
        return baseboard.version;
    }

    @ResolveField(() => String, { nullable: true })
    public async serial(parent: Partial<InfoBaseboard>): Promise<string | undefined> {
        const baseboard = await this.getCachedData(parent);
        return baseboard.serial;
    }

    @ResolveField(() => String, { nullable: true })
    public async assetTag(parent: Partial<InfoBaseboard>): Promise<string | undefined> {
        const baseboard = await this.getCachedData(parent);
        return baseboard.assetTag;
    }

    @ResolveField(() => Number, { nullable: true })
    public async memMax(parent: Partial<InfoBaseboard>): Promise<number | null | undefined> {
        const baseboard = await this.getCachedData(parent);
        return baseboard.memMax;
    }

    @ResolveField(() => Number, { nullable: true })
    public async memSlots(parent: Partial<InfoBaseboard>): Promise<number | undefined> {
        const baseboard = await this.getCachedData(parent);
        return baseboard.memSlots;
    }
}
