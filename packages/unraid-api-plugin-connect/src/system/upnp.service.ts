import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Client, Mapping } from '@runonflux/nat-upnp';
import { isDefined } from 'class-validator';

import { ConfigType } from '../config.entity.js';
import { ONE_HOUR_SECS } from '../helpers/consts.js';
import { UPNP_CLIENT_TOKEN } from '../helpers/dependency-injection.js';

@Injectable()
export class UpnpService {
    private readonly logger = new Logger(UpnpService.name);
    #enabled = false;
    #wanPort: number | undefined;
    #localPort: number | undefined;

    constructor(
        private readonly configService: ConfigService<ConfigType>,
        @Inject(UPNP_CLIENT_TOKEN) private readonly upnpClient: Client
    ) {}

    get enabled() {
        return this.#enabled;
    }
    get wanPort() {
        return this.#wanPort;
    }
    get localPort() {
        return this.#localPort;
    }

    private async removeUpnpLease() {
        if (isDefined(this.#wanPort) && isDefined(this.#localPort)) {
            const portMap = {
                public: this.#wanPort,
                private: this.#localPort,
            };
            try {
                const result = await this.upnpClient.removeMapping(portMap);
                this.logger.log('UPNP Lease removed %o', portMap);
                this.logger.debug('UPNP Lease removal result %O', result);
            } catch (error) {
                this.logger.warn('UPNP Lease removal failed %O', error);
            }
        } else {
            this.logger.warn('UPNP Lease removal failed. Missing ports: %o', {
                wanPort: this.#wanPort,
                localPort: this.#localPort,
            });
        }
    }

    /**
     * Attempts to create a UPNP lease/mapping using the given ports. Logs result.
     * - Modifies `#enabled`, `#wanPort`, and `#localPort` state upon success. Does not modify upon failure.
     * @param opts
     * @returns true if operation succeeds.
     */
    private async renewUpnpLease(opts?: {
        publicPort?: number;
        privatePort?: number;
        serverName?: string;
    }) {
        const {
            publicPort = this.#wanPort,
            privatePort = this.#localPort,
            serverName = this.configService.get('connect.config.serverName', 'No server name found'),
        } = opts ?? {};
        if (isDefined(publicPort) && isDefined(privatePort)) {
            const upnpOpts = {
                public: publicPort,
                private: privatePort,
                description: `Unraid Remote Access - ${serverName}`,
                ttl: ONE_HOUR_SECS,
            };
            try {
                const result = await this.upnpClient.createMapping(upnpOpts);
                this.logger.log('UPNP Lease renewed %o', upnpOpts);
                this.logger.debug('UPNP Lease renewal result %O', result);
                this.#wanPort = upnpOpts.public;
                this.#localPort = upnpOpts.private;
                this.#enabled = true;
                return true;
            } catch (error) {
                this.logger.warn('UPNP Lease renewal failed %O', error);
            }
        } else {
            this.logger.warn('UPNP Lease renewal failed. Missing ports: %o', {
                publicPort,
                privatePort,
            });
        }
    }

    private async getMappings() {
        try {
            const mappings = await this.upnpClient.getMappings();
            return mappings;
        } catch (error) {
            this.logger.warn('Mapping retrieval failed %O', error);
        }
    }

    private async findAvailableWanPort(args?: {
        mappings?: Mapping[];
        minPort?: number;
        maxPort?: number;
        maxAttempts?: number;
    }): Promise<number | undefined> {
        const {
            mappings = await this.getMappings(),
            minPort = 35_000,
            maxPort = 65_000,
            maxAttempts = 50,
        } = args ?? {};
        const excludedPorts = new Set(mappings?.map((val) => val.public.port));
        // Generate a random port between minPort and maxPort up to maxAttempts times
        for (let i = 0; i < maxAttempts; i++) {
            const port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
            if (!excludedPorts.has(port)) {
                return port;
            }
        }
    }

    private async getWanPortToUse(args?: { wanPort?: number }) {
        if (!args) return this.#wanPort;
        if (args.wanPort) return args.wanPort;
        const newWanPort = await this.findAvailableWanPort();
        if (!newWanPort) {
            this.logger.warn('Could not find an available WAN port!');
        }
        return newWanPort;
    }

    async enableUpnp(args?: { sslPort?: number; wanPort?: number }) {
        const { sslPort, wanPort } = args ?? {};
        if (wanPort !== this.#wanPort || this.#localPort !== sslPort) {
            await this.removeUpnpLease();
        }

        // todo: start the renewal job

        const wanPortToUse = await this.getWanPortToUse(args);
        this.#wanPort = wanPortToUse;
        const localPortToUse = sslPort ?? this.#localPort;
        if (wanPortToUse && localPortToUse) {
            await this.renewUpnpLease({
                publicPort: wanPortToUse,
                privatePort: localPortToUse,
            });
        } else {
            await this.disableUpnp();
            this.logger.error('No WAN port found %o. Disabled UPNP.', {
                wanPort: wanPortToUse,
                localPort: localPortToUse,
            });
            throw new Error('No WAN port found. Disabled UPNP.');
        }
    }

    async disableUpnp() {
        // todo: stop the renewal job
        await this.removeUpnpLease();
        this.#enabled = false;
        this.#wanPort = undefined;
        this.#localPort = undefined;
    }
}
