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
            systemOpenssl: softwareVersions.systemOpenssl,
            node: softwareVersions.node,
            v8: softwareVersions.v8,
            npm: softwareVersions.npm,
            yarn: softwareVersions.yarn,
            pm2: softwareVersions.pm2,
            gulp: softwareVersions.gulp,
            grunt: softwareVersions.grunt,
            git: softwareVersions.git,
            tsc: softwareVersions.tsc,
            mysql: softwareVersions.mysql,
            redis: softwareVersions.redis,
            mongodb: softwareVersions.mongodb,
            apache: (softwareVersions as any).apache,
            nginx: softwareVersions.nginx,
            php: softwareVersions.php,
            postfix: softwareVersions.postfix,
            postgresql: softwareVersions.postgresql,
            perl: softwareVersions.perl,
            python: softwareVersions.python,
            python3: softwareVersions.python3,
            pip: softwareVersions.pip,
            pip3: softwareVersions.pip3,
            java: softwareVersions.java,
            gcc: softwareVersions.gcc,
            virtualbox: softwareVersions.virtualbox,
            docker: softwareVersions.docker,
        };
    }
}
