import { GraphQLISODateTime, ResolveField, Resolver } from '@nestjs/graphql';

import { CachedResolverBase } from '@app/unraid-api/graph/resolvers/base/cached-resolver.base.js';
import { InfoOs } from '@app/unraid-api/graph/resolvers/info/os/os.model.js';
import { OsService } from '@app/unraid-api/graph/resolvers/info/os/os.service.js';

@Resolver(() => InfoOs)
export class OsResolver extends CachedResolverBase<InfoOs> {
    constructor(private readonly osService: OsService) {
        super();
    }

    // Implementation of abstract methods from CachedResolverBase
    protected getPromiseCacheKey(): string {
        return '_osPromise';
    }

    protected hasData(parent: Partial<InfoOs>): boolean {
        // Check if we have OS-specific data
        return parent.platform !== undefined;
    }

    protected fetchData(): Promise<InfoOs> {
        return this.osService.generateOs();
    }

    @ResolveField(() => String, { nullable: true })
    public async platform(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.platform;
    }

    @ResolveField(() => String, { nullable: true })
    public async distro(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.distro;
    }

    @ResolveField(() => String, { nullable: true })
    public async release(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.release;
    }

    @ResolveField(() => String, { nullable: true })
    public async codename(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.codename;
    }

    @ResolveField(() => String, { nullable: true })
    public async kernel(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.kernel;
    }

    @ResolveField(() => String, { nullable: true })
    public async arch(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.arch;
    }

    @ResolveField(() => String, { nullable: true })
    public async hostname(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.hostname;
    }

    @ResolveField(() => String, { nullable: true })
    public async fqdn(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.fqdn;
    }

    @ResolveField(() => String, { nullable: true })
    public async logofile(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.logofile;
    }

    @ResolveField(() => String, { nullable: true })
    public async serial(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.serial;
    }

    @ResolveField(() => String, { nullable: true })
    public async build(parent: Partial<InfoOs>): Promise<string | undefined> {
        const os = await this.getCachedData(parent);
        return os.build;
    }

    @ResolveField(() => Boolean, { nullable: true })
    public async uefi(parent: Partial<InfoOs>): Promise<boolean | null | undefined> {
        const os = await this.getCachedData(parent);
        return os.uefi;
    }

    @ResolveField(() => GraphQLISODateTime, { nullable: true })
    public async uptime(parent: Partial<InfoOs>): Promise<Date | undefined> {
        const os = await this.getCachedData(parent);
        // Convert ISO string to Date object
        return os.uptime ? new Date(os.uptime) : undefined;
    }
}
