import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Readable } from 'stream';

import { watch } from 'chokidar';
import Docker from 'dockerode';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getters } from '@app/store/index.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { getDockerClient } from '@app/unraid-api/graph/resolvers/docker/utils/docker-client.js';

enum DockerEventAction {
    DIE = 'die',
    KILL = 'kill',
    OOM = 'oom',
    PAUSE = 'pause',
    RESTART = 'restart',
    START = 'start',
    STOP = 'stop',
    UNPAUSE = 'unpause',
    EXEC_CREATE = 'exec_create',
    EXEC_START = 'exec_start',
    EXEC_DIE = 'exec_die',
}

enum DockerEventType {
    CONTAINER = 'container',
}

interface DockerEvent {
    Action?: string;
    status?: string;
    from?: string;
    Type?: string;
    [key: string]: unknown;
}

@Injectable()
export class DockerEventService implements OnModuleDestroy, OnModuleInit {
    private client: Docker;
    private dockerEventStream: Readable | null = null;
    private readonly logger = new Logger(DockerEventService.name);

    private watchedActions = [
        DockerEventAction.DIE,
        DockerEventAction.KILL,
        DockerEventAction.OOM,
        DockerEventAction.PAUSE,
        DockerEventAction.RESTART,
        DockerEventAction.START,
        DockerEventAction.STOP,
        DockerEventAction.UNPAUSE,
        DockerEventAction.EXEC_CREATE,
        DockerEventAction.EXEC_START,
        DockerEventAction.EXEC_DIE,
    ];

    private containerActions = [
        DockerEventAction.DIE,
        DockerEventAction.KILL,
        DockerEventAction.OOM,
        DockerEventAction.PAUSE,
        DockerEventAction.RESTART,
        DockerEventAction.START,
        DockerEventAction.STOP,
        DockerEventAction.UNPAUSE,
    ];

    constructor(private readonly dockerService: DockerService) {
        this.client = getDockerClient();
    }

    async onModuleInit() {
        this.setupVarRunWatch();
    }

    onModuleDestroy() {
        this.stopEventStream();
    }

    private setupVarRunWatch() {
        const paths = getters.paths();
        watch(paths['var-run'], { ignoreInitial: false })
            .on('add', async (path) => {
                if (path === paths['docker-socket']) {
                    this.logger.debug('Starting docker event watch');
                    await this.setupDockerWatch();
                }
            })
            .on('unlink', (path) => {
                if (path === paths['docker-socket']) {
                    this.stopEventStream();
                }
            });
    }

    /**
     * Stop the Docker event stream
     */
    public stopEventStream(): void {
        if (this.dockerEventStream) {
            this.logger.debug('Stopping docker event stream');
            this.dockerEventStream.removeAllListeners();
            this.dockerEventStream.destroy();
            this.dockerEventStream = null;
        }
    }

    private async handleDockerEvent(event: unknown): Promise<void> {
        if (typeof event !== 'object' || event === null) {
            this.logger.error('Received non-object event', event);
            return;
        }

        // Type assertion to DockerEvent
        const dockerEvent = event as DockerEvent;

        // Check if this is an action we're watching
        const actionName = dockerEvent.Action || dockerEvent.status;
        const shouldProcess = this.watchedActions.some(
            (action) => typeof actionName === 'string' && actionName.startsWith(action)
        );

        if (shouldProcess) {
            this.logger.debug(`[${dockerEvent.from}] ${dockerEvent.Type}->${actionName}`);

            // For container lifecycle events, publish updated app info
            if (
                dockerEvent.Type === DockerEventType.CONTAINER &&
                typeof actionName === 'string' &&
                this.containerActions.includes(actionName as DockerEventAction)
            ) {
                const appInfo = await this.dockerService.getAppInfo();
                await pubsub.publish(PUBSUB_CHANNEL.INFO, appInfo);
                this.logger.debug(`Published app info update due to event: ${actionName}`);
            }
        }
    }

    private async setupDockerWatch(): Promise<void> {
        this.logger.debug('Setting up Docker event stream');

        try {
            const eventStream = await this.client.getEvents();
            this.dockerEventStream = eventStream as unknown as Readable;

            if (this.dockerEventStream) {
                // Add error handlers to raw stream to prevent uncaught errors
                this.dockerEventStream.on('error', (error) => {
                    this.logger.error('Docker event stream error', error);
                    this.stopEventStream();
                });

                this.dockerEventStream.on('end', () => {
                    this.logger.debug('Docker event stream closed');
                    this.stopEventStream();
                });

                // Set up data handler for line-by-line JSON parsing
                this.dockerEventStream.on('data', async (chunk) => {
                    try {
                        // Split the chunk by newlines to handle multiple JSON bodies
                        const jsonStrings = chunk
                            .toString()
                            .split('\n')
                            .filter((line) => line.trim() !== '');

                        for (const jsonString of jsonStrings) {
                            try {
                                const event = JSON.parse(jsonString);
                                await this.handleDockerEvent(event);
                            } catch (parseError) {
                                this.logger
                                    .error(`Failed to parse individual Docker event: ${parseError instanceof Error ? parseError.message : String(parseError)}
                                Event data: ${jsonString}`);
                            }
                        }
                    } catch (error) {
                        this.logger.error(
                            `Failed to process Docker event chunk: ${error instanceof Error ? error.message : String(error)}`
                        );
                        this.logger.verbose(`Full chunk: ${chunk.toString()}`);
                    }
                });

                this.logger.debug('Docker event stream active');
            }
        } catch (error) {
            this.logger.error(
                `Failed to set up Docker event stream - ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Check if the Docker event service is currently running
     * @returns True if the event stream is active
     */
    public isActive(): boolean {
        return this.dockerEventStream !== null;
    }
}
