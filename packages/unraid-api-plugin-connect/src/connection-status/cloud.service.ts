import { Injectable } from '@nestjs/common';

import { MinigraphStatus } from '../config/my-servers.config.js';
import { connectionStatus, ConnectTunnelService } from '../tunnel/connect-tunnel.service.js';

@Injectable()
export class CloudService {
    constructor(private readonly tunnel: ConnectTunnelService) {}
    checkConnector() {
        const state = connectionStatus(this.tunnel.status());
        return {
            status:
                state.status === 'connected'
                    ? MinigraphStatus.CONNECTED
                    : state.status === 'connecting'
                      ? MinigraphStatus.CONNECTING
                      : MinigraphStatus.PRE_INIT,
            error: state.error,
            timeout: null,
        };
    }
    async checkCloudConnection() {
        const state = connectionStatus(this.tunnel.status());
        return {
            status: state.status === 'connected' ? 'ok' : state.status,
            error: state.error,
        };
    }
}
