import { Injectable, Logger } from '@nestjs/common';
import { createInterface } from 'readline';

import type { ResultPromise } from 'execa';
import { execa } from 'execa';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import {
    DockerLayerProgress,
    DockerUpdateEventType,
    DockerUpdateProgress,
} from '@app/unraid-api/graph/resolvers/docker/docker-update-progress.model.js';

interface ActiveUpdate {
    containerId: string;
    containerName: string;
    process: ResultPromise;
    layers: Map<string, DockerLayerProgress>;
}

@Injectable()
export class DockerUpdateProgressService {
    private readonly logger = new Logger(DockerUpdateProgressService.name);
    private activeUpdates = new Map<string, ActiveUpdate>();

    public async updateContainerWithProgress(containerId: string, containerName: string): Promise<void> {
        if (this.activeUpdates.has(containerId)) {
            throw new Error(`Container ${containerName} is already being updated`);
        }

        this.logger.log(`Starting update with progress for ${containerName} (${containerId})`);

        this.publishProgress({
            containerId,
            containerName,
            type: DockerUpdateEventType.STARTED,
            message: `Starting update for ${containerName}`,
        });

        const updateProcess = execa(
            '/usr/local/emhttp/plugins/dynamix.docker.manager/scripts/update_container',
            [encodeURIComponent(containerName)],
            {
                shell: 'bash',
                all: true,
                reject: false,
                env: {
                    ...process.env,
                    DOCKER_CLI_FORMAT: 'json',
                },
            }
        );

        const activeUpdate: ActiveUpdate = {
            containerId,
            containerName,
            process: updateProcess,
            layers: new Map(),
        };

        this.activeUpdates.set(containerId, activeUpdate);

        try {
            if (updateProcess.stdout) {
                const rl = createInterface({
                    input: updateProcess.stdout,
                    crlfDelay: Infinity,
                });

                rl.on('line', (line) => {
                    this.processOutputLine(activeUpdate, line);
                });

                rl.on('error', (err) => {
                    this.logger.error(`Error reading update output for ${containerName}`, err);
                });
            }

            if (updateProcess.stderr) {
                updateProcess.stderr.on('data', (data: Buffer) => {
                    const message = data.toString().trim();
                    if (message) {
                        this.logger.debug(`Update stderr for ${containerName}: ${message}`);
                    }
                });
            }

            const result = await updateProcess;

            if (result.failed) {
                this.publishProgress({
                    containerId,
                    containerName,
                    type: DockerUpdateEventType.ERROR,
                    message: `Update failed for ${containerName}`,
                    error: result.stderr || result.shortMessage || 'Unknown error',
                });
                throw new Error(`Failed to update container ${containerName}: ${result.shortMessage}`);
            }

            this.publishProgress({
                containerId,
                containerName,
                type: DockerUpdateEventType.COMPLETE,
                message: `Successfully updated ${containerName}`,
                overallProgress: 100,
            });
        } finally {
            this.activeUpdates.delete(containerId);
        }
    }

    private processOutputLine(update: ActiveUpdate, line: string): void {
        const trimmed = line.trim();
        if (!trimmed) return;

        const { containerId, containerName } = update;

        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const json = JSON.parse(trimmed);
                this.processDockerJson(update, json);
                return;
            } catch {
                // Not valid JSON, treat as log line
            }
        }

        const pullMatch = trimmed.match(/^([a-f0-9]+):\s*(.+)$/i);
        if (pullMatch) {
            const [, layerId, status] = pullMatch;
            this.processLayerStatus(update, layerId, status);
            return;
        }

        const progressMatch = trimmed.match(/^Pulling\s+(.+)$/i);
        if (progressMatch) {
            this.publishProgress({
                containerId,
                containerName,
                type: DockerUpdateEventType.PULLING,
                message: trimmed,
            });
            return;
        }

        this.publishProgress({
            containerId,
            containerName,
            type: DockerUpdateEventType.LOG,
            message: trimmed,
        });
    }

    private processDockerJson(update: ActiveUpdate, json: Record<string, unknown>): void {
        const { containerId, containerName } = update;

        if (json.status && typeof json.id === 'string') {
            const layerId = json.id as string;
            const status = json.status as string;

            const progressDetail = json.progressDetail as
                | { current?: number; total?: number }
                | undefined;

            const layerProgress: DockerLayerProgress = {
                layerId,
                status,
                current: progressDetail?.current,
                total: progressDetail?.total,
                progress:
                    progressDetail?.current && progressDetail?.total
                        ? Math.round((progressDetail.current / progressDetail.total) * 100)
                        : undefined,
            };

            update.layers.set(layerId, layerProgress);

            let eventType: DockerUpdateEventType;
            if (status.toLowerCase().includes('downloading')) {
                eventType = DockerUpdateEventType.LAYER_DOWNLOADING;
            } else if (status.toLowerCase().includes('extracting')) {
                eventType = DockerUpdateEventType.LAYER_EXTRACTING;
            } else if (status.toLowerCase().includes('pull complete')) {
                eventType = DockerUpdateEventType.LAYER_COMPLETE;
            } else if (status.toLowerCase().includes('already exists')) {
                eventType = DockerUpdateEventType.LAYER_ALREADY_EXISTS;
            } else {
                eventType = DockerUpdateEventType.LOG;
            }

            const overallProgress = this.calculateOverallProgress(update);

            this.publishProgress({
                containerId,
                containerName,
                type: eventType,
                layerId,
                message: json.progress
                    ? `${layerId}: ${status} ${json.progress}`
                    : `${layerId}: ${status}`,
                overallProgress,
                layers: Array.from(update.layers.values()),
            });
        } else if (json.status) {
            this.publishProgress({
                containerId,
                containerName,
                type: DockerUpdateEventType.LOG,
                message: json.status as string,
            });
        } else if (json.error) {
            this.publishProgress({
                containerId,
                containerName,
                type: DockerUpdateEventType.ERROR,
                error: json.error as string,
            });
        }
    }

    private processLayerStatus(update: ActiveUpdate, layerId: string, status: string): void {
        const { containerId, containerName } = update;

        const progressMatch = status.match(/(\d+(?:\.\d+)?)\s*%/);
        const progress = progressMatch ? parseFloat(progressMatch[1]) : undefined;

        const bytesMatch = status.match(/(\d+(?:\.\d+)?)\s*([KMGT]?B)/i);
        let current: number | undefined;
        let total: number | undefined;

        if (bytesMatch) {
            const totalMatch = status.match(/of\s+(\d+(?:\.\d+)?)\s*([KMGT]?B)/i);
            if (totalMatch) {
                total = this.parseBytes(totalMatch[1], totalMatch[2]);
                current = this.parseBytes(bytesMatch[1], bytesMatch[2]);
            }
        }

        const layerProgress: DockerLayerProgress = {
            layerId,
            status,
            progress,
            current,
            total,
        };

        update.layers.set(layerId, layerProgress);

        let eventType: DockerUpdateEventType;
        const statusLower = status.toLowerCase();
        if (statusLower.includes('downloading')) {
            eventType = DockerUpdateEventType.LAYER_DOWNLOADING;
        } else if (statusLower.includes('extracting')) {
            eventType = DockerUpdateEventType.LAYER_EXTRACTING;
        } else if (statusLower.includes('complete') || statusLower.includes('done')) {
            eventType = DockerUpdateEventType.LAYER_COMPLETE;
        } else if (statusLower.includes('already exists')) {
            eventType = DockerUpdateEventType.LAYER_ALREADY_EXISTS;
        } else {
            eventType = DockerUpdateEventType.LOG;
        }

        const overallProgress = this.calculateOverallProgress(update);

        this.publishProgress({
            containerId,
            containerName,
            type: eventType,
            layerId,
            message: `${layerId}: ${status}`,
            overallProgress,
            layers: Array.from(update.layers.values()),
        });
    }

    private calculateOverallProgress(update: ActiveUpdate): number {
        const layers = Array.from(update.layers.values());
        if (layers.length === 0) return 0;

        let totalProgress = 0;
        let countedLayers = 0;

        for (const layer of layers) {
            if (layer.progress !== undefined) {
                totalProgress += layer.progress;
                countedLayers++;
            } else if (
                layer.status.toLowerCase().includes('complete') ||
                layer.status.toLowerCase().includes('already exists')
            ) {
                totalProgress += 100;
                countedLayers++;
            }
        }

        if (countedLayers === 0) return 0;
        return Math.round(totalProgress / layers.length);
    }

    private parseBytes(value: string, unit: string): number {
        const num = parseFloat(value);
        const multipliers: Record<string, number> = {
            B: 1,
            KB: 1024,
            MB: 1024 * 1024,
            GB: 1024 * 1024 * 1024,
            TB: 1024 * 1024 * 1024 * 1024,
        };
        return num * (multipliers[unit.toUpperCase()] || 1);
    }

    private publishProgress(progress: DockerUpdateProgress): void {
        this.logger.debug(
            `Update progress for ${progress.containerName}: ${progress.type} - ${progress.message ?? ''}`
        );
        pubsub.publish(PUBSUB_CHANNEL.DOCKER_UPDATE_PROGRESS, {
            dockerUpdateProgress: progress,
        });
    }

    public isUpdating(containerId: string): boolean {
        return this.activeUpdates.has(containerId);
    }

    public getActiveUpdates(): string[] {
        return Array.from(this.activeUpdates.keys());
    }
}
