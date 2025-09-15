import { Injectable, Logger } from '@nestjs/common';
import { Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { execa } from 'execa';

import {
    ApiStatusResponse,
    RestartApiResponse,
} from '@app/unraid-api/graph/resolvers/api-management/api-management.model.js';

@Injectable()
@Resolver()
export class ApiManagementResolver {
    private readonly logger = new Logger(ApiManagementResolver.name);

    @Query(() => ApiStatusResponse, { description: 'Get the current API service status' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    async apiStatus(): Promise<ApiStatusResponse> {
        try {
            const { stdout } = await execa('unraid-api', ['status'], { shell: 'bash' });
            return {
                status: stdout,
                isRunning: stdout.includes('running') || stdout.includes('active'),
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error('Failed to get API status:', error);
            return {
                status: `Error: ${error.message}`,
                isRunning: false,
                timestamp: new Date().toISOString(),
            };
        }
    }

    @Mutation(() => RestartApiResponse, { description: 'Restart the API service using rc.d script' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async restartApiService(): Promise<RestartApiResponse> {
        try {
            this.logger.log('Restarting API service via rc.d script');

            const { stdout, stderr } = await execa('/etc/rc.d/rc.unraid-api', ['restart'], {
                shell: 'bash',
                timeout: 30000,
            });

            return {
                success: true,
                message: stdout || 'API restart initiated successfully',
                error: stderr || null,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error('Failed to restart API:', error);
            return {
                success: false,
                message: 'Failed to restart API service',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
}
