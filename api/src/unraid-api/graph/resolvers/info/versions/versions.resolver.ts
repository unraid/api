import { ResolveField, Resolver } from '@nestjs/graphql';

import { CachedResolverBase } from '@app/unraid-api/graph/resolvers/base/cached-resolver.base.js';
import { InfoVersions } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';
import { VersionsService } from '@app/unraid-api/graph/resolvers/info/versions/versions.service.js';

@Resolver(() => InfoVersions)
export class VersionsResolver extends CachedResolverBase<InfoVersions> {
    constructor(private readonly versionsService: VersionsService) {
        super();
    }

    // Implementation of abstract methods from CachedResolverBase
    protected getPromiseCacheKey(): string {
        return '_versionsPromise';
    }

    protected hasData(parent: Partial<InfoVersions>): boolean {
        // Check if we have versions-specific data
        return parent.unraid !== undefined;
    }

    protected fetchData(): Promise<InfoVersions> {
        return this.versionsService.generateVersions();
    }

    @ResolveField(() => String, { nullable: true })
    public async unraid(parent: Partial<InfoVersions>): Promise<string | undefined> {
        const versions = await this.getCachedData(parent);
        return versions.unraid;
    }

    @ResolveField(() => String, { nullable: true })
    public async kernel(parent: Partial<InfoVersions>): Promise<string | undefined> {
        const versions = await this.getCachedData(parent);
        return versions.kernel;
    }

    @ResolveField(() => String, { nullable: true })
    public async node(parent: Partial<InfoVersions>): Promise<string | undefined> {
        const versions = await this.getCachedData(parent);
        return versions.node;
    }

    @ResolveField(() => String, { nullable: true })
    public async npm(parent: Partial<InfoVersions>): Promise<string | undefined> {
        const versions = await this.getCachedData(parent);
        return versions.npm;
    }

    @ResolveField(() => String, { nullable: true })
    public async docker(parent: Partial<InfoVersions>): Promise<string | undefined> {
        const versions = await this.getCachedData(parent);
        return versions.docker;
    }
}
