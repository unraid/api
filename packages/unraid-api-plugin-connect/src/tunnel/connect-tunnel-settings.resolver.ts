import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import {
    ConnectCertificateMigration,
    ConnectTunnelSettings,
    ConnectTunnelSettingsInput,
} from './connect-tunnel-settings.model.js';
import { ConnectTunnelService } from './connect-tunnel.service.js';
import { ConnectGatewaySettingsInput } from './gateway-settings.js';

@Resolver(() => ConnectTunnelSettings)
export class ConnectTunnelSettingsResolver {
    constructor(private readonly tunnel: ConnectTunnelService) {}

    @Query(() => ConnectTunnelSettings)
    @UsePermissions({ action: AuthAction.READ_ANY, resource: Resource.CONNECT })
    async connectTunnelSettings(): Promise<ConnectTunnelSettings> {
        const config = this.tunnel.settings();
        return {
            gateway: this.tunnel.gatewaySettings(),
            previewMode: this.tunnel.previewMode(),
            signedIn: Boolean(config.apikey),
            certificateManagementEnabled: config.certificateManagementEnabled,
            tunnelRemoteAccessEnabled: config.tunnelRemoteAccessEnabled,
            serverDataReportingEnabled: config.serverDataReportingEnabled,
            tunnelUrl:
                config.tunnelRemoteAccessEnabled && config.tunnelHostname
                    ? `https://${config.tunnelHostname}`
                    : null,
            status: this.tunnel.status(),
            overviewCleanupPending:
                !config.serverDataReportingEnabled && !config.serverDataRemoteCleared,
            overview: await this.tunnel.preview(),
            certificateMigration: await this.tunnel.certificateMigration(),
        };
    }

    @Mutation(() => ConnectTunnelSettings)
    @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.CONNECT })
    async updateConnectTunnelSettings(@Args('input') input: ConnectTunnelSettingsInput) {
        await this.tunnel.update(input);
        return this.connectTunnelSettings();
    }

    @Mutation(() => ConnectTunnelSettings)
    @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.CONNECT })
    async updateConnectGatewayServices(@Args('input') input: ConnectGatewaySettingsInput) {
        await this.tunnel.updateGatewayServices(input);
        return this.connectTunnelSettings();
    }

    @Mutation(() => ConnectCertificateMigration)
    @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.CONNECT })
    async migrateConnectCertificate(
        @Args('confirmationToken', { type: () => String }) confirmationToken: string
    ) {
        await this.tunnel.migrateCertificate(confirmationToken);
        return this.tunnel.certificateMigration();
    }
}
