import { ConfigService } from '@nestjs/config';
import { ResolveField, Resolver } from '@nestjs/graphql';

import { versions } from 'systeminformation';

import {
    CoreVersions,
    InfoVersions,
    PackageVersions,
} from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

@Resolver(() => InfoVersions)
export class VersionsResolver {
    constructor(private readonly configService: ConfigService) {}

    @ResolveField(() => CoreVersions)
    core(): CoreVersions {
        const unraid = this.configService.get<string>('store.emhttp.var.version') || 'unknown';
        const api = this.configService.get<string>('api.version') || 'unknown';

        return {
            unraid,
            api,
            kernel: undefined, // Will be resolved separately if requested
        };
    }

    @ResolveField(() => PackageVersions)
    async packages(): Promise<PackageVersions> {
        const softwareVersions = await versions();

        return {
            openssl: softwareVersions.openssl,
            node: softwareVersions.node,
            npm: softwareVersions.npm,
            pm2: softwareVersions.pm2,
            git: softwareVersions.git,
            nginx: softwareVersions.nginx,
            php: softwareVersions.php,
            docker: softwareVersions.docker,
        };
    }
}
