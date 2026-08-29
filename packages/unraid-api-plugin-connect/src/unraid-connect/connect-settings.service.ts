import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { SettingSlice } from '@unraid/shared/jsonforms/settings.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';

import type { ConnectFeatures } from '../tunnel/connect-tunnel.service.js';
import { RemoteAccessService } from '../remote-access/remote-access.service.js';
import { ConnectTunnelService } from '../tunnel/connect-tunnel.service.js';
import {
    ConnectSettingsInput,
    ConnectSignInInput,
    EnableDynamicRemoteAccessInput,
    RemoteAccess,
} from './connect.model.js';

declare module '@unraid/shared/services/user-settings.js' {
    interface UserSettings {
        'remote-access': RemoteAccess;
    }
}

@Injectable()
export class ConnectSettingsService {
    constructor(
        private readonly config: ConfigService,
        private readonly tunnel: ConnectTunnelService,
        userSettings: UserSettingsService,
        private readonly remote: RemoteAccessService
    ) {
        userSettings.register('remote-access', {
            buildSlice: () => this.remote.buildSlice(),
            getCurrentValues: async () => this.remote.settings(),
            updateValues: async (input) => {
                await this.remote.update(input);
                return { restartRequired: false, values: this.remote.settings() };
            },
        });
    }
    async buildRemoteAccessSlice(): Promise<SettingSlice> {
        return this.remote.buildSlice();
    }
    async getCurrentSettings() {
        const config = this.tunnel.settings();
        return {
            certificateManagementEnabled: config.certificateManagementEnabled,
            tunnelRemoteAccessEnabled: config.tunnelRemoteAccessEnabled,
            serverDataReportingEnabled: config.serverDataReportingEnabled,
            ...(await this.dynamicRemoteAccessSettings()),
        };
    }
    async dynamicRemoteAccessSettings() {
        return this.remote.settings();
    }
    async syncSettings(input: Partial<ConnectSettingsInput>): Promise<boolean> {
        if (input.accessType)
            await this.remote.update({
                accessType: input.accessType,
                ...(input.forwardType != null ? { forwardType: input.forwardType } : {}),
                ...(input.port !== undefined ? { port: input.port } : {}),
            });
        const changes: Partial<ConnectFeatures> = {};
        for (const key of [
            'certificateManagementEnabled',
            'tunnelRemoteAccessEnabled',
            'serverDataReportingEnabled',
        ] as const) {
            if (input[key] != null) changes[key] = input[key];
        }
        if (Object.keys(changes).length) await this.tunnel.update(changes);
        return false;
    }
    async enableDynamicRemoteAccess(_input: EnableDynamicRemoteAccessInput): Promise<never> {
        throw new Error('Use the Connect tunnel settings');
    }
    async signIn(input: ConnectSignInInput): Promise<boolean> {
        if (!input.userInfo) throw new Error('Missing user attributes');
        await this.tunnel.signIn(input.apiKey, input.userInfo);
        return true;
    }
    async signOut(): Promise<boolean> {
        await this.tunnel.signOut();
        return true;
    }
    async restartApi(): Promise<void> {
        await this.tunnel.start();
    }
    async extraAllowedOrigins(): Promise<string[]> {
        return this.config.get<string[]>('api.extraOrigins', []);
    }
    isConnectPluginInstalled(): boolean {
        return true;
    }
}
