import { Injectable } from '@nestjs/common';

import type { ConnectStatusQuery, SystemReportQuery } from '@app/unraid-api/cli/generated/graphql.js';
import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import {
    CONNECT_STATUS_QUERY,
    SERVICES_QUERY,
    SYSTEM_REPORT_QUERY,
} from '@app/unraid-api/cli/queries/system-report.query.js';

export interface ServiceInfo {
    id?: string | null;
    name?: string | null;
    online?: boolean | null;
    version?: string | null;
    uptime?: {
        timestamp?: string | null;
    } | null;
}

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
        cloud: ServiceInfo | null;
        minigraph: ServiceInfo | null;
        allServices: Array<{
            name?: string | null;
            online?: boolean | null;
            version?: string | null;
            uptime?: string | null;
        }>;
    };
}

@Injectable()
export class ApiReportService {
    constructor(
        private readonly internalClient: CliInternalClientService,
        private readonly logger: LogService
    ) {}

    private createApiReportData(params: {
        apiRunning: boolean;
        systemData?: SystemReportQuery;
        connectData?: ConnectStatusQuery['connect'] | null;
        servicesData?: ServiceInfo[];
        errorReason?: string;
    }): ApiReportData {
        const { apiRunning, systemData, connectData, servicesData = [], errorReason } = params;

        return {
            timestamp: new Date().toISOString(),
            connectionStatus: {
                running: apiRunning ? 'yes' : 'no',
            },
            system: systemData
                ? {
                      id: systemData.info.system.uuid,
                      name: systemData.server?.name || 'Unknown',
                      version: systemData.info.versions.unraid || 'Unknown',
                      machineId: 'REDACTED',
                      manufacturer: systemData.info.system.manufacturer,
                      model: systemData.info.system.model,
                  }
                : {
                      name: 'Unknown',
                      version: 'Unknown',
                      machineId: 'REDACTED',
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
                      reason: errorReason || 'Connect plugin not installed or not available',
                  },
            config: systemData
                ? {
                      valid: systemData.config.valid,
                      error: systemData.config.error || null,
                  }
                : {
                      valid: null,
                      error: errorReason || 'Unable to retrieve config',
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
        };
    }

    async generateReport(apiRunning = true): Promise<ApiReportData> {
        if (!apiRunning) {
            return this.createApiReportData({
                apiRunning: false,
                errorReason: 'API is not running',
            });
        }

        const client = await this.internalClient.getClient();

        // Query system data
        let systemResult: { data: SystemReportQuery } | null = null;
        try {
            systemResult = await client.query({
                query: SYSTEM_REPORT_QUERY,
            });
        } catch (error) {
            this.logger.error('Error querying system data: ' + error);
            return this.createApiReportData({
                apiRunning,
                errorReason: 'System query failed',
            });
        }

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
        let servicesData: ServiceInfo[] = [];
        try {
            const servicesResult = await client.query({
                query: SERVICES_QUERY,
            });
            servicesData = servicesResult.data.services || [];
        } catch (error) {
            this.logger.debug('Error querying services: ' + error);
        }

        return this.createApiReportData({
            apiRunning,
            systemData: systemResult.data,
            connectData,
            servicesData,
        });
    }
}
