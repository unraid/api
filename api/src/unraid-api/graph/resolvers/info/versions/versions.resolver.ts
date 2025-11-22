import { ConfigService } from '@nestjs/config';
import { ResolveField, Resolver } from '@nestjs/graphql';

import { versions } from 'systeminformation';

import { getPackageJson } from '@app/environment.js';
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

    @ResolveField(() => PackageVersions, { nullable: true })
    async packages(): Promise<PackageVersions | null> {
        try {
            const softwareVersions = await versions();

            return {
                openssl: softwareVersions.openssl,
                node: softwareVersions.node,
                npm: softwareVersions.npm,
                nodemon: getPackageJson().dependencies?.nodemon,
                git: softwareVersions.git,
                nginx: softwareVersions.nginx,
                php: softwareVersions.php,
                docker: softwareVersions.docker,
            };
        } catch (error) {
            console.error('Failed to get package versions:', error);
            return null;
        }
    }
}
