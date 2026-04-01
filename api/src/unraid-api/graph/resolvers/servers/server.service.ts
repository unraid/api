import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

import { GraphQLError } from 'graphql';
import * as ini from 'ini';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getters, store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { StateFileKey } from '@app/store/types.js';
import { AvahiService } from '@app/unraid-api/avahi/avahi.service.js';
import { ArrayState } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { buildServerResponse } from '@app/unraid-api/graph/resolvers/servers/build-server-response.js';
import { Server } from '@app/unraid-api/graph/resolvers/servers/server.model.js';
import { NginxService } from '@app/unraid-api/nginx/nginx.service.js';

@Injectable()
export class ServerService {
    private readonly logger = new Logger(ServerService.name);

    constructor(
        private readonly avahiService: AvahiService,
        private readonly nginxService: NginxService
    ) {}

    private async readPersistedIdentity(): Promise<{
        name: string;
        comment: string;
        sysModel: string;
    }> {
        const identConfigPath = getters.paths().identConfig;

        if (!identConfigPath) {
            throw new Error('ident.cfg path not found');
        }

        const contents = await readFile(identConfigPath, 'utf8');
        const parsed = ini.parse(contents) as {
            NAME?: string;
            COMMENT?: string;
            SYS_MODEL?: string;
        };

        return {
            name: parsed.NAME ?? '',
            comment: parsed.COMMENT ?? '',
            sysModel: parsed.SYS_MODEL ?? '',
        };
    }

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

    private getLiveIdentityState(emhttpState: ReturnType<typeof getters.emhttp>) {
        return {
            lanName: emhttpState.nginx?.lanName ?? '',
            lanMdns: emhttpState.nginx?.lanMdns ?? '',
            defaultUrl: emhttpState.nginx?.defaultUrl?.trim() ?? '',
        };
    }

    private async refreshNginxStateAfterNameChange(
        name: string,
        persistedIdentity: Awaited<ReturnType<ServerService['readPersistedIdentity']>>
    ): Promise<ReturnType<typeof getters.emhttp>> {
        try {
            await this.avahiService.restart();
        } catch (error) {
            this.logger.error('Failed to restart Avahi after server rename', error as Error);
            throw new GraphQLError('Failed to update server identity', {
                extensions: {
                    cause:
                        error instanceof Error && error.message
                            ? error.message
                            : 'Avahi restart failed after ident.cfg update',
                    persistedIdentity,
                },
            });
        }

        const nginxReloaded = await this.nginxService.reload();

        if (!nginxReloaded) {
            this.logger.error('Failed to reload nginx after server rename');
            throw new GraphQLError('Failed to update server identity', {
                extensions: {
                    cause: 'Nginx reload failed after Avahi restart',
                    persistedIdentity,
                },
            });
        }

        try {
            await store.dispatch(loadSingleStateFile(StateFileKey.nginx)).unwrap();
        } catch (error) {
            this.logger.error('Failed to reload nginx state after server rename', error as Error);
            throw new GraphQLError('Failed to update server identity', {
                extensions: {
                    cause:
                        error instanceof Error && error.message
                            ? error.message
                            : 'Failed to reload nginx.ini after nginx reload',
                    persistedIdentity,
                },
            });
        }

        const refreshedEmhttp = getters.emhttp();
        const liveIdentity = this.getLiveIdentityState(refreshedEmhttp);

        if (liveIdentity.lanName !== name || !liveIdentity.defaultUrl) {
            throw new GraphQLError('Failed to update server identity', {
                extensions: {
                    cause: 'Live network identity did not converge after Avahi restart and nginx reload',
                    persistedIdentity,
                    liveIdentity,
                },
            });
        }

        return refreshedEmhttp;
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
            return buildServerResponse(currentEmhttp, {
                comment: currentComment,
                name: currentName,
            });
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
        let emcmdError: unknown;

        try {
            await emcmd(params, { waitForToken: true });
            this.logger.log('Server identity updated successfully via emcmd.');
        } catch (error) {
            emcmdError = error;
            this.logger.error('emcmd reported a server identity update failure', error);
        }

        try {
            const persistedIdentity = await this.readPersistedIdentity();
            const persistedMatches =
                persistedIdentity.name === name &&
                persistedIdentity.comment === nextComment &&
                persistedIdentity.sysModel === nextSysModel;

            if (!persistedMatches) {
                throw new GraphQLError('Failed to update server identity', {
                    extensions: {
                        cause:
                            emcmdError instanceof Error && emcmdError.message
                                ? emcmdError.message
                                : 'ident.cfg was not updated with the requested identity',
                        persistedIdentity,
                    },
                });
            }

            if (emcmdError) {
                this.logger.warn(
                    'emcmd reported an error, but ident.cfg contains the requested server identity.'
                );
            }

            const latestEmhttp =
                name !== currentName
                    ? await this.refreshNginxStateAfterNameChange(name, persistedIdentity)
                    : getters.emhttp();

            return buildServerResponse(latestEmhttp, {
                comment: nextComment,
                name,
            });
        } catch (error) {
            if (error instanceof GraphQLError) {
                throw error;
            }

            this.logger.error('Failed to verify persisted server identity', error);
            throw new GraphQLError('Failed to update server identity', {
                extensions: {
                    cause:
                        error instanceof Error && error.message
                            ? error.message
                            : 'Unknown server identity persistence verification failure',
                },
            });
        }
    }
}
