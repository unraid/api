import { Injectable, Logger } from '@nestjs/common';
import { stat } from 'fs/promises';

import type { ExecaError } from 'execa';
import { execa } from 'execa';

import { AppError } from '@app/core/errors/app-error.js';
import {
    DockerContainerLogLine,
    DockerContainerLogs,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { getDockerClient } from '@app/unraid-api/graph/resolvers/docker/utils/docker-client.js';

@Injectable()
export class DockerLogService {
    private readonly logger = new Logger(DockerLogService.name);
    private readonly client = getDockerClient();

    private static readonly DEFAULT_LOG_TAIL = 200;
    private static readonly MAX_LOG_TAIL = 2000;

    public async getContainerLogSizes(containerNames: string[]): Promise<Map<string, number>> {
        const logSizes = new Map<string, number>();
        if (!Array.isArray(containerNames) || containerNames.length === 0) {
            return logSizes;
        }

        for (const rawName of containerNames) {
            const normalized = (rawName ?? '').replace(/^\//, '');
            if (!normalized) {
                logSizes.set(normalized, 0);
                continue;
            }

            try {
                const container = this.client.getContainer(normalized);
                const info = await container.inspect();
                const logPath = info.LogPath;

                if (!logPath || typeof logPath !== 'string' || !logPath.length) {
                    logSizes.set(normalized, 0);
                    continue;
                }

                const stats = await stat(logPath).catch(() => null);
                logSizes.set(normalized, stats?.size ?? 0);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error ?? 'unknown error');
                this.logger.debug(
                    `Failed to determine log size for container ${normalized}: ${message}`
                );
                logSizes.set(normalized, 0);
            }
        }

        return logSizes;
    }

    public async getContainerLogs(
        id: string,
        options?: { since?: Date | null; tail?: number | null }
    ): Promise<DockerContainerLogs> {
        const normalizedId = (id ?? '').trim();
        if (!normalizedId) {
            throw new AppError('Container id is required to fetch logs.', 400);
        }

        const tail = this.normalizeLogTail(options?.tail);
        const args = ['logs', '--timestamps', '--tail', String(tail)];
        const sinceIso = options?.since instanceof Date ? options.since.toISOString() : null;
        if (sinceIso) {
            args.push('--since', sinceIso);
        }
        args.push(normalizedId);

        try {
            const { stdout } = await execa('docker', args);
            const lines = this.parseDockerLogOutput(stdout);
            const cursor =
                lines.length > 0 ? lines[lines.length - 1].timestamp : (options?.since ?? null);

            return {
                containerId: normalizedId,
                lines,
                cursor: cursor ?? undefined,
            };
        } catch (error: unknown) {
            const execaError = error as ExecaError;
            const stderr = typeof execaError?.stderr === 'string' ? execaError.stderr.trim() : '';
            const message = stderr || execaError?.message || 'Unknown error';
            this.logger.error(
                `Failed to fetch logs for container ${normalizedId}: ${message}`,
                execaError
            );
            throw new AppError(`Failed to fetch logs for container ${normalizedId}.`);
        }
    }

    private normalizeLogTail(tail?: number | null): number {
        if (typeof tail !== 'number' || Number.isNaN(tail)) {
            return DockerLogService.DEFAULT_LOG_TAIL;
        }
        const coerced = Math.floor(tail);
        if (!Number.isFinite(coerced) || coerced <= 0) {
            return DockerLogService.DEFAULT_LOG_TAIL;
        }
        return Math.min(coerced, DockerLogService.MAX_LOG_TAIL);
    }

    private parseDockerLogOutput(output: string): DockerContainerLogLine[] {
        if (!output) {
            return [];
        }
        return output
            .split(/\r?\n/g)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => this.parseDockerLogLine(line))
            .filter((entry): entry is DockerContainerLogLine => Boolean(entry));
    }

    private parseDockerLogLine(line: string): DockerContainerLogLine | null {
        const trimmed = line.trim();
        if (!trimmed.length) {
            return null;
        }
        const firstSpaceIndex = trimmed.indexOf(' ');
        if (firstSpaceIndex === -1) {
            return {
                timestamp: new Date(),
                message: trimmed,
            };
        }
        const potentialTimestamp = trimmed.slice(0, firstSpaceIndex);
        const message = trimmed.slice(firstSpaceIndex + 1);
        const parsedTimestamp = new Date(potentialTimestamp);
        if (Number.isNaN(parsedTimestamp.getTime())) {
            return {
                timestamp: new Date(),
                message: trimmed,
            };
        }
        return {
            timestamp: parsedTimestamp,
            message,
        };
    }
}
