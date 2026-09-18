import { ConfigService } from '@nestjs/config';
import { ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { versions } from 'systeminformation';

import {
    CoreVersions,
    InfoVersions,
    PackageVersions,
} from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

@Resolver(() => InfoVersions)
export class VersionsResolver {
    constructor(private readonly configService: ConfigService) {}

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
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

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    @ResolveField(() => PackageVersions, { nullable: true })
    async packages(): Promise<PackageVersions | null> {
        try {
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
        } catch (error) {
            console.error('Failed to get package versions:', error);
            return null;
        }
    }
}
