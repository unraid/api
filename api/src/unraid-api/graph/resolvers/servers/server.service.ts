import { Injectable, Logger } from '@nestjs/common';

import { GraphQLError } from 'graphql';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getters } from '@app/store/index.js';
import {
    ProfileModel,
    Server,
    ServerStatus,
} from '@app/unraid-api/graph/resolvers/servers/server.model.js';

@Injectable()
export class ServerService {
    private readonly logger = new Logger(ServerService.name);

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
            const fsState = currentEmhttp.var?.fsState;
            if (fsState !== 'Stopped') {
                throw new GraphQLError('The array must be stopped to change the server name.');
            }
        }

        const params: Record<string, string> = {
            changeNames: 'Apply',
            NAME: name,
        };

        if (comment !== undefined) {
            params.COMMENT = comment;
        }
        if (sysModel !== undefined) {
            params.SYS_MODEL = sysModel;
        }

        try {
            await emcmd(params, { waitForToken: true });
            this.logger.log('Server identity updated successfully via emcmd.');
            const latestEmhttp = getters.emhttp();
            const responseComment = comment ?? latestEmhttp.var?.comment ?? currentComment;
            return this.buildServerResponse(latestEmhttp, name, responseComment);
        } catch (error) {
            this.logger.error('Failed to update server identity', error);
            throw new GraphQLError('Failed to update server identity');
        }
    }
}
