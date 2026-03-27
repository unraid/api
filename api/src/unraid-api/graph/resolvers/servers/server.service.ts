import { Injectable, Logger } from '@nestjs/common';

import { GraphQLError } from 'graphql';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getters } from '@app/store/index.js';
import { ArrayState } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import {
    ProfileModel,
    Server,
    ServerStatus,
} from '@app/unraid-api/graph/resolvers/servers/server.model.js';

@Injectable()
export class ServerService {
    private readonly logger = new Logger(ServerService.name);

    private buildIdentityUpdateParams(
        emhttpState: ReturnType<typeof getters.emhttp>,
        name: string,
        comment: string,
        sysModel: string
    ): Record<string, string> {
        return {
            changeNames: 'Apply',
            server_https: emhttpState.nginx?.sslEnabled ? 'on' : '',
            server_name: emhttpState.nginx?.lanName || 'localhost',
            server_addr: emhttpState.nginx?.lanIp || '127.0.0.1',
            NAME: name,
            COMMENT: comment,
            SYS_MODEL: sysModel,
        };
    }

    private buildServerResponse(
        emhttpState: ReturnType<typeof getters.emhttp>,
        name: string,
        comment: string
    ): Server {
        const guid = emhttpState.var?.regGuid ?? '';
        const lanip = emhttpState.networks?.[0]?.ipaddr?.[0] ?? '';
        const port = emhttpState.var?.port ?? '';
        const owner: ProfileModel = {
            id: 'local',
            username: 'root',
            url: '',
            avatar: '',
        };

        return {
            id: 'local',
            owner,
            guid,
            apikey: '',
            name,
            comment,
            status: ServerStatus.ONLINE,
            wanip: '',
            lanip,
            localurl: lanip ? `http://${lanip}${port ? `:${port}` : ''}` : '',
            remoteurl: '',
        };
    }

    /**
     * Updates the server identity (name and comment/description).
     * The array must be stopped to change the server name.
     */
    async updateServerIdentity(name: string, comment?: string, sysModel?: string): Promise<Server> {
        this.logger.log(
            `Updating server identity to Name: ${name}, Comment: ${comment}, Model: ${sysModel}`
        );

        // Frontend validation logic:
        // Invalid chars: anything not alphanumeric, dot, or dash
        if (/[^a-zA-Z0-9.-]/.test(name)) {
            throw new GraphQLError(
                'Server name contains invalid characters. Only alphanumeric, dot, and dash are allowed.'
            );
        }
        // Check length
        if (name.length > 15) {
            throw new GraphQLError('Server name must be 15 characters or less.');
        }

        // Invalid end: must not end with dot or dash
        if (/[.-]$/.test(name)) {
            throw new GraphQLError('Server name must not end with a dot or a dash.');
        }

        // Comment validation
        if (comment !== undefined) {
            if (comment.length > 64) {
                throw new GraphQLError('Server description must be 64 characters or less.');
            }
            if (/["\\]/.test(comment)) {
                throw new GraphQLError('Server description cannot contain quotes or backslashes.');
            }
        }
        if (sysModel !== undefined && /["\\]/.test(sysModel)) {
            throw new GraphQLError('Server model cannot contain quotes or backslashes.');
        }

        // Check if array is stopped (required for changing name)
        // We only enforce this if name is changing, but to be safe and consistent with UI, likely good to enforce.
        // Actually, UI only disables it if array is not stopped.
        // Let's check current name.
        const currentEmhttp = getters.emhttp();
        const currentName = currentEmhttp.var?.name ?? '';
        const currentComment = currentEmhttp.var?.comment ?? '';
        const currentSysModel = currentEmhttp.var?.sysModel ?? '';
        const nextComment = comment ?? currentComment;
        const nextSysModel = sysModel ?? currentSysModel;

        if (name === currentName && nextComment === currentComment && nextSysModel === currentSysModel) {
            this.logger.log('Server identity unchanged; skipping emcmd update.');
            return this.buildServerResponse(currentEmhttp, currentName, currentComment);
        }

        if (name !== currentName) {
            const mdState = currentEmhttp.var?.mdState;
            const fsState = currentEmhttp.var?.fsState;
            const arrayStopped = mdState === ArrayState.STOPPED || fsState === 'Stopped';
            if (!arrayStopped) {
                throw new GraphQLError('The array must be stopped to change the server name.');
            }
        }

        const params = this.buildIdentityUpdateParams(currentEmhttp, name, nextComment, nextSysModel);

        try {
            await emcmd(params, { waitForToken: true });
            this.logger.log('Server identity updated successfully via emcmd.');
            const latestEmhttp = getters.emhttp();
            return this.buildServerResponse(latestEmhttp, name, nextComment);
        } catch (error) {
            this.logger.error('Failed to update server identity', error);
            throw new GraphQLError('Failed to update server identity', {
                extensions: {
                    cause:
                        error instanceof Error && error.message
                            ? error.message
                            : 'Unknown server identity update failure',
                },
            });
        }
    }
}
