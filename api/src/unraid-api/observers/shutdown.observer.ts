import type { OnApplicationShutdown } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { type IncomingMessage, type Server, type ServerResponse } from 'http';

import type { FastifyInstance } from 'fastify';

/**
 * @todo Swap to this globally. This is a better way to handle shutdowns (right now they're handled in index.ts)
 */
@Injectable()
export class ShutdownObserver implements OnApplicationShutdown {
    private httpServers: FastifyInstance<Server, IncomingMessage, ServerResponse>[] = [];
    private logger = new Logger(ShutdownObserver.name);

    public addFastifyServer(server: FastifyInstance<Server, IncomingMessage, ServerResponse>): void {
        this.logger.debug('Adding Fastify Server to Shutdown Observers');
        this.httpServers.push(server);
    }

    public async onApplicationShutdown(signal): Promise<void> {
        console.log('Application Shutdown detected with signal: ' + signal);
        this.logger.debug('Shutting down NestJS application');
        for (const server of this.httpServers) {
            try {
                this.logger.debug('Shut down server');
                await server?.close?.();
            } catch (error) {
                this.logger.error(`Error Shutting Down Server: ${error}`);
            }
        }
    }
}
