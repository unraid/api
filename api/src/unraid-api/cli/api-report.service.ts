import { Injectable } from '@nestjs/common';

import type { ConnectStatusQuery } from '@app/unraid-api/cli/generated/graphql.js';
import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import {
    CONNECT_STATUS_QUERY,
    SERVICES_QUERY,
    SYSTEM_REPORT_QUERY,
} from '@app/unraid-api/cli/queries/system-report.query.js';

export interface ApiReportData {
    timestamp: string;
    connectionStatus: {
        running: 'yes' | 'no';
    };
    system: {
        id?: string | null;
        name: string;
        version: string;
        machineId: string;
        manufacturer?: string | null;
        model?: string | null;
    };
    connect: {
        installed: boolean;
        dynamicRemoteAccess?: {
            enabledType: string;
            runningType: string;
            error?: string | null;
        };
        reason?: string;
    };
    config: {
        valid?: boolean | null;
        error?: string | null;
    };
    services: {
        cloud: any;
        minigraph: any;
        allServices: Array<{
            name?: string | null;
            online?: boolean | null;
            version?: string | null;
            uptime?: string | null;
        }>;
    };
    remote: {
        apikey: string;
        localApiKey: string;
        accesstoken: string;
        idtoken: string;
        refreshtoken: string;
        ssoSubIds: string;
        allowedOrigins: string;
        email: string;
    };
}

@Injectable()
export class ApiReportService {
    constructor(
        private readonly internalClient: CliInternalClientService,
        private readonly logger: LogService
    ) {}

    async generateReport(apiRunning = true): Promise<ApiReportData> {
        if (!apiRunning) {
            return {
                timestamp: new Date().toISOString(),
                connectionStatus: {
                    running: 'no',
                },
                system: {
                    name: 'Unknown',
                    version: 'Unknown',
                    machineId: 'REDACTED',
                },
                connect: {
                    installed: false,
                    reason: 'API is not running',
                },
                config: {
                    valid: null,
                    error: 'API is not running',
                },
                services: {
                    cloud: null,
                    minigraph: null,
                    allServices: [],
                },
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
        }

        const client = await this.internalClient.getClient();

        // Query system data
        const systemResult = await client.query({
            query: SYSTEM_REPORT_QUERY,
        });

        // Try to query connect status
        let connectData: ConnectStatusQuery['connect'] | null = null;
        try {
            const connectResult = await client.query({
                query: CONNECT_STATUS_QUERY,
            });
            connectData = connectResult.data.connect;
        } catch (error) {
            this.logger.debug('Connect plugin not available: ' + error);
        }

        // Query services
        let servicesData: any[] = [];
        try {
            const servicesResult = await client.query({
                query: SERVICES_QUERY,
            });
            servicesData = servicesResult.data.services || [];
        } catch (error) {
            this.logger.debug('Error querying services: ' + error);
        }

        return {
            timestamp: new Date().toISOString(),
            connectionStatus: {
                running: apiRunning ? 'yes' : 'no',
            },
            system: {
                id: systemResult.data.info.system.uuid,
                name: systemResult.data.server?.name || 'Unknown',
                version: systemResult.data.info.versions.unraid || 'Unknown',
                machineId: 'REDACTED',
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
    }
}
