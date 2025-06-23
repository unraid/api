import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { URL_TYPE } from '@unraid/shared/network.model.js';

import { ONE_MINUTE_MS } from '../helper/generic-consts.js';
import {
    AccessUrlObject,
    ConfigType,
    DynamicRemoteAccessState,
    DynamicRemoteAccessType,
    makeDisabledDynamicRemoteAccessState,
} from '../model/connect-config.model.js';
import { StaticRemoteAccessService } from './static-remote-access.service.js';
import { UpnpRemoteAccessService } from './upnp-remote-access.service.js';

@Injectable()
export class DynamicRemoteAccessService implements OnModuleInit {
    private readonly logger = new Logger(DynamicRemoteAccessService.name);

    constructor(
        private readonly configService: ConfigService<ConfigType, true>,
        private readonly staticRemoteAccessService: StaticRemoteAccessService,
        private readonly upnpRemoteAccessService: UpnpRemoteAccessService
    ) {}

    async onModuleInit() {
        await this.initRemoteAccess();
    }

    /**
     * Get the current state of dynamic remote access
     */
    getState(): DynamicRemoteAccessState {
        return this.configService.getOrThrow<DynamicRemoteAccessState>('connect.dynamicRemoteAccess');
    }

    keepAlive() {
        this.receivePing();
    }

    private receivePing() {
        this.configService.set('connect.dynamicRemoteAccess.lastPing', Date.now());
    }

    private clearPing() {
        this.configService.set('connect.dynamicRemoteAccess.lastPing', null);
        this.logger.verbose('cleared ping');
    }

    async checkForTimeout() {
        const state = this.getState();
        if (state.lastPing && Date.now() - state.lastPing > ONE_MINUTE_MS) {
            this.logger.warn('No pings received in 1 minute, disabling dynamic remote access');
            await this.stopRemoteAccess();
        }
    }

    setAllowedUrl(url: AccessUrlObject) {
        const currentAllowed = this.configService.get('connect.dynamicRemoteAccess.allowedUrl') ?? {};
        const newAllowed: AccessUrlObject = {
            ...currentAllowed,
            ...url,
            type: url.type ?? URL_TYPE.WAN,
        };
        this.configService.set('connect.dynamicRemoteAccess.allowedUrl', newAllowed);
        this.logger.verbose(`setAllowedUrl: ${JSON.stringify(newAllowed, null, 2)}`);
    }

    private setErrorMessage(error: string) {
        this.configService.set('connect.dynamicRemoteAccess.error', error);
    }

    private clearError() {
        this.configService.set('connect.dynamicRemoteAccess.error', null);
    }

    async enableDynamicRemoteAccess(input: {
        allowedUrl: AccessUrlObject;
        type: DynamicRemoteAccessType;
    }) {
        try {
            this.logger.verbose(`enableDynamicRemoteAccess ${JSON.stringify(input, null, 2)}`);
            await this.stopRemoteAccess();
            if (input.allowedUrl) {
                this.setAllowedUrl({
                    ipv4: input.allowedUrl.ipv4?.toString() ?? null,
                    ipv6: input.allowedUrl.ipv6?.toString() ?? null,
                    type: input.allowedUrl.type,
                    name: input.allowedUrl.name,
                });
            }
            await this.setType(input.type);
        } catch (error) {
            this.logger.error(error);
            const message = error instanceof Error ? error.message : 'Unknown Error';
            this.setErrorMessage(message);
            return error;
        }
    }

    /**
     * Set the dynamic remote access type and handle the transition
     * @param type The new dynamic remote access type to set
     */
    private async setType(type: DynamicRemoteAccessType): Promise<void> {
        this.logger.verbose(`setType: ${type}`);
        // Update the config first
        this.configService.set('connect.config.dynamicRemoteAccessType', type);

        if (type === DynamicRemoteAccessType.DISABLED) {
            this.logger.log('Disabling Dynamic Remote Access');
            await this.stopRemoteAccess();
            return;
        }

        // Update the state to reflect the new type
        this.configService.set('connect.dynamicRemoteAccess', {
            ...makeDisabledDynamicRemoteAccessState(),
            runningType: type,
        });

        // Start the appropriate remote access service
        if (type === DynamicRemoteAccessType.STATIC) {
            await this.staticRemoteAccessService.beginRemoteAccess();
        } else if (type === DynamicRemoteAccessType.UPNP) {
            await this.upnpRemoteAccessService.begin();
        }
    }

    /**
     * Stop remote access and reset the state
     */
    async stopRemoteAccess(): Promise<void> {
        const state = this.configService.get<DynamicRemoteAccessState>('connect.dynamicRemoteAccess');

        if (state?.runningType === DynamicRemoteAccessType.STATIC) {
            await this.staticRemoteAccessService.stopRemoteAccess();
        } else if (state?.runningType === DynamicRemoteAccessType.UPNP) {
            await this.upnpRemoteAccessService.stop();
        }

        // Reset the state
        this.configService.set('connect.dynamicRemoteAccess', makeDisabledDynamicRemoteAccessState());
        this.clearPing();
        this.clearError();
    }

    private async initRemoteAccess() {
        const enabled = this.configService.get('connect.config.wanaccess', { infer: true });
        if (!enabled) {
            return;
        }

        // const type = this.configService.get('connect.config.dynamicRemoteAccessType', { infer: true });
        // await this.setType(type);
    }
}
