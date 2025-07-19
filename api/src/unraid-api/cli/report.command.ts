import { Command, CommandRunner, Option } from 'nest-commander';

import type { ConnectStatusQuery } from '@app/unraid-api/cli/generated/graphql.js';
import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import {
    CONNECT_STATUS_QUERY,
    SERVICES_QUERY,
    SYSTEM_REPORT_QUERY,
} from '@app/unraid-api/cli/queries/system-report.query.js';

@Command({ name: 'report' })
export class ReportCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly internalClient: CliInternalClientService
    ) {
        super();
    }

    @Option({
        flags: '-r, --raw',
        description: 'whether to enable raw command output',
        defaultValue: false,
    })
    parseRaw(): boolean {
        return true;
    }

    @Option({
        flags: '-j, --json',
        description: 'Display JSON output for this command',
        defaultValue: false,
    })
    parseJson(): boolean {
        return true;
    }

    async report(): Promise<string | void> {
        try {
            // Check if API is running
            const { isUnraidApiRunning } = await import('@app/core/utils/pm2/unraid-api-running.js');
            const apiRunning = await isUnraidApiRunning().catch((err) => {
                this.logger.debug('failed to get PM2 state with error: ' + err);
                return false;
            });

            if (!apiRunning) {
                this.logger.warn(
                    JSON.stringify(
                        {
                            error: 'API is not running. Please start the API server before running a report.',
                            apiRunning: false,
                        },
                        null,
                        2
                    )
                );
                return;
            }

            // Get GraphQL client and query system data
            const client = await this.internalClient.getClient();

            // Always query the base system data
            const systemResult = await client.query({
                query: SYSTEM_REPORT_QUERY,
            });

            // Try to query connect status, but handle it gracefully if connect is not installed
            let connectData: ConnectStatusQuery['connect'] | null = null;
            try {
                const connectResult = await client.query({
                    query: CONNECT_STATUS_QUERY,
                });
                connectData = connectResult.data.connect;
            } catch (error) {
                this.logger.debug(
                    'Connect plugin not available or error querying connect status: ' + error
                );
                // Connect plugin is not installed or not available, continue without it
            }

            // Query services to get cloud/minigraph status
            let servicesData: any[] = [];
            try {
                const servicesResult = await client.query({
                    query: SERVICES_QUERY,
                });
                servicesData = servicesResult.data.services || [];
            } catch (error) {
                this.logger.debug('Error querying services: ' + error);
                // Services query failed, continue without it
            }

            // Build report with the same structure as before but using GraphQL data
            const report = {
                timestamp: new Date().toISOString(),
                connectionStatus: {
                    running: apiRunning ? 'yes' : ('no' as const),
                },
                system: {
                    id: systemResult.data.info.system.uuid,
                    name: systemResult.data.server?.name || 'Unknown',
                    version: systemResult.data.info.versions.unraid || 'Unknown',
                    machineId: 'REDACTED', // Redact sensitive machine ID
                    manufacturer: systemResult.data.info.system.manufacturer,
                    model: systemResult.data.info.system.model,
                },
                connect: connectData
                    ? {
                          installed: true,
                          dynamicRemoteAccess: {
                              enabledType: connectData.dynamicRemoteAccess.enabledType,
                              runningType: connectData.dynamicRemoteAccess.runningType,
                              error: connectData.dynamicRemoteAccess.error || null,
                          },
                      }
                    : {
                          installed: false,
                          reason: 'Connect plugin not installed or not available',
                      },
                config: {
                    valid: systemResult.data.config.valid,
                    error: systemResult.data.config.error || null,
                },
                // Cloud/minigraph services status
                services: {
                    cloud: servicesData.find((s) => s.name === 'cloud') || null,
                    minigraph: servicesData.find((s) => s.name === 'minigraph') || null,
                    allServices: servicesData.map((s) => ({
                        name: s.name,
                        online: s.online,
                        version: s.version,
                        uptime: s.uptime?.timestamp || null,
                    })),
                },
                // Keep some legacy fields for compatibility
                remote: {
                    apikey: 'REDACTED',
                    localApiKey: 'REDACTED',
                    accesstoken: 'REDACTED',
                    idtoken: 'REDACTED',
                    refreshtoken: 'REDACTED',
                    ssoSubIds: 'REDACTED',
                    allowedOrigins: 'REDACTED',
                    email: 'REDACTED',
                },
            };

            this.logger.clear();
            this.logger.info(JSON.stringify(report, null, 2));
        } catch (error) {
            this.logger.debug('Error generating report via GraphQL: ' + error);
            this.logger.warn(
                JSON.stringify(
                    {
                        error: 'Failed to generate system report. Please ensure the API is running and properly configured.',
                        details: error instanceof Error ? error.message : String(error),
                    },
                    null,
                    2
                )
            );
        }
    }

    async run(): Promise<void> {
        await this.report();
    }
}
