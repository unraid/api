import { ConfigService } from '@nestjs/config';
import { ResolveField, Resolver } from '@nestjs/graphql';

import { versions } from 'systeminformation';

import {
    CoreVersions,
    InfoVersions,
    PackageVersions,
    UpgradeInfo,
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
    upgrade(): UpgradeInfo {
        const currentVersion =
            this.configService.get<string>('onboardingTracker.currentVersion') ??
            this.configService.get<string>('store.emhttp.var.version');
        const lastSeenVersion =
            this.configService.get<string>('onboardingTracker.lastTrackedVersion') ??
            this.configService.get<string>('api.lastSeenOsVersion');
        const completedStepsMap =
            this.configService.get<Record<string, { version: string }>>(
                'onboardingTracker.completedSteps'
            ) ?? {};

        const completedSteps =
            currentVersion && completedStepsMap
                ? Object.entries(completedStepsMap)
                      .filter(([, value]) => value?.version === currentVersion)
                      .map(([stepId]) => stepId)
                : [];

        const isUpgrade = Boolean(
            lastSeenVersion && currentVersion && lastSeenVersion !== currentVersion
        );

        return {
            isUpgrade,
            previousVersion: isUpgrade ? lastSeenVersion : undefined,
            currentVersion: currentVersion || undefined,
            completedSteps,
        };
    }
}
