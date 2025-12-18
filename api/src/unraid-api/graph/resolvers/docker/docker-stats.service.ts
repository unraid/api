import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createInterface } from 'readline';

import { execa } from 'execa';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers.js';
import { DockerContainerStats } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';

@Injectable()
export class DockerStatsService implements OnModuleDestroy {
    private readonly logger = new Logger(DockerStatsService.name);
    private statsProcess: ReturnType<typeof execa> | null = null;
    private readonly STATS_FORMAT =
        '{{.ID}};{{.CPUPerc}};{{.MemUsage}};{{.MemPerc}};{{.NetIO}};{{.BlockIO}}';

    onModuleDestroy() {
        this.stopStatsStream();
    }

    public startStatsStream() {
        if (this.statsProcess) {
            return;
        }

        this.logger.log('Starting docker stats stream');

        try {
            this.statsProcess = execa('docker', ['stats', '--format', this.STATS_FORMAT, '--no-trunc'], {
                all: true,
                reject: false, // Don't throw on exit code != 0, handle via parsing/events
            });

            if (this.statsProcess.stdout) {
                const rl = createInterface({
                    input: this.statsProcess.stdout,
                    crlfDelay: Infinity,
                });

                rl.on('line', (line) => {
                    if (!line.trim()) return;
                    this.processStatsLine(line);
                });

                rl.on('error', (err) => {
                    this.logger.error('Error reading docker stats stream', err);
                });
            }

            if (this.statsProcess.stderr) {
                this.statsProcess.stderr.on('data', (data: Buffer) => {
                    // Log docker stats errors but don't crash
                    this.logger.debug(`Docker stats stderr: ${data.toString()}`);
                });
            }

            // Handle process exit
            this.statsProcess
                .then((result) => {
                    if (result.failed && !result.signal) {
                        this.logger.error('Docker stats process exited with error', result.shortMessage);
                        this.stopStatsStream();
                    }
                })
                .catch((err) => {
                    if (!err.killed) {
                        this.logger.error('Docker stats process ended unexpectedly', err);
                        this.stopStatsStream();
                    }
                });
        } catch (error) {
            this.logger.error('Failed to start docker stats', error);
            catchHandlers.docker(error as Error);
        }
    }

    public stopStatsStream() {
        if (this.statsProcess) {
            this.logger.log('Stopping docker stats stream');
            this.statsProcess.kill();
            this.statsProcess = null;
        }
    }

    private processStatsLine(line: string) {
        try {
            // format: ID;CPUPerc;MemUsage;MemPerc;NetIO;BlockIO
            // Example: 123abcde;0.00%;10MiB / 100MiB;10.00%;1kB / 2kB;0B / 0B

            // Remove ANSI escape codes if any (docker stats sometimes includes them)
            // eslint-disable-next-line no-control-regex
            const cleanLine = line.replace(/\x1B\[[0-9;]*[mK]/g, '');

            const parts = cleanLine.split(';');
            if (parts.length < 6) return;

            const [id, cpuPercStr, memUsage, memPercStr, netIO, blockIO] = parts;

            const stats: DockerContainerStats = {
                id,
                cpuPercent: this.parsePercentage(cpuPercStr),
                memUsage,
                memPercent: this.parsePercentage(memPercStr),
                netIO,
                blockIO,
            };

            pubsub.publish(PUBSUB_CHANNEL.DOCKER_STATS, { dockerContainerStats: stats });
        } catch (error) {
            this.logger.debug(`Failed to process stats line: ${line}`, error);
        }
    }

    private parsePercentage(value: string): number {
        return parseFloat(value.replace('%', '')) || 0;
    }
}
