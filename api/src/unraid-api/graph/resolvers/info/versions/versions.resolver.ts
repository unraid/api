import { ConfigService } from '@nestjs/config';
import { ResolveField, Resolver } from '@nestjs/graphql';

import { versions } from 'systeminformation';

import { OnboardingTracker } from '@app/unraid-api/config/onboarding-tracker.module.js';
import { buildUpgradeInfoFromSnapshot } from '@app/unraid-api/graph/resolvers/info/versions/upgrade-info.util.js';
import {
    CoreVersions,
    InfoVersions,
    PackageVersions,
    UpgradeInfo,
} from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

@Resolver(() => InfoVersions)
export class VersionsResolver {
    constructor(
        private readonly configService: ConfigService,
        private readonly onboardingTracker: OnboardingTracker
    ) {}

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

    @ResolveField(() => UpgradeInfo)
    async upgrade(): Promise<UpgradeInfo> {
        const snapshot = await this.onboardingTracker.getUpgradeSnapshot();
        return buildUpgradeInfoFromSnapshot(snapshot);
    }
}
