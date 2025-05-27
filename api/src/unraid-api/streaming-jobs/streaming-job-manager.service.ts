import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

import { execa } from 'execa';
import { v4 as uuidv4 } from 'uuid';

import { StreamingJobInfo } from '@app/unraid-api/streaming-jobs/streaming-jobs.types.js';

export interface StreamingJobOptions {
    command: string;
    args: string[];
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    onProgress?: (progress: number) => void;
    onOutput?: (data: string) => void;
    onError?: (error: string) => void;
}

export interface StreamingJobResult {
    success: boolean;
    exitCode?: number;
    signal?: string;
    error?: string;
    output?: string;
    duration: number;
}

export interface ProgressExtractor {
    (output: string): number | null;
}

@Injectable()
export class StreamingJobManager extends EventEmitter {
    private readonly logger = new Logger(StreamingJobManager.name);
    private readonly activeJobs = new Map<string, StreamingJobInfo>();
    private readonly processes = new Map<string, ReturnType<typeof execa>>();
    private readonly progressExtractors = new Map<string, ProgressExtractor>();

    async startStreamingJob(
        type: string,
        options: StreamingJobOptions,
        progressExtractor?: ProgressExtractor
    ): Promise<{ jobId: string; promise: Promise<StreamingJobResult> }> {
        const jobId = uuidv4();
        const startTime = new Date();

        const jobInfo: StreamingJobInfo = {
            jobId,
            processId: 0,
            startTime,
            type,
            status: 'running',
            progress: 0,
        };

        this.activeJobs.set(jobId, jobInfo);

        if (progressExtractor) {
            this.progressExtractors.set(jobId, progressExtractor);
        }

        const promise = this.executeStreamingJob(jobId, options);

        this.logger.log(`Started streaming job ${jobId} for ${type}`);
        this.emit('jobStarted', jobInfo);

        return { jobId, promise };
    }

    private async executeStreamingJob(
        jobId: string,
        options: StreamingJobOptions
    ): Promise<StreamingJobResult> {
        const startTime = Date.now();
        let timeoutHandle: NodeJS.Timeout | undefined;

        return new Promise((resolve) => {
            const jobInfo = this.activeJobs.get(jobId);
            if (!jobInfo) {
                resolve({
                    success: false,
                    error: 'Job not found',
                    duration: 0,
                });
                return;
            }

            const childProcess = execa(options.command, options.args, {
                cwd: options.cwd,
                env: { ...process.env, ...options.env },
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: options.timeout,
                killSignal: 'SIGTERM',
            });

            jobInfo.processId = childProcess.pid || 0;
            this.processes.set(jobId, childProcess);

            let output = '';
            let errorOutput = '';

            if (options.timeout) {
                timeoutHandle = setTimeout(() => {
                    this.logger.warn(`Streaming job ${jobId} timed out after ${options.timeout}ms`);
                    this.cancelJob(jobId);
                }, options.timeout);
            }

            childProcess.stdout?.on('data', (data: Buffer) => {
                const chunk = data.toString();
                output += chunk;

                if (options.onOutput) {
                    options.onOutput(chunk);
                }

                this.extractProgress(jobId, chunk, options.onProgress);
            });

            childProcess.stderr?.on('data', (data: Buffer) => {
                const chunk = data.toString();
                errorOutput += chunk;

                if (options.onError) {
                    options.onError(chunk);
                }

                this.extractProgress(jobId, chunk, options.onProgress);
            });

            childProcess
                .then((result) => {
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }

                    const duration = Date.now() - startTime;
                    const success = result.exitCode === 0;

                    jobInfo.status = success ? 'completed' : 'failed';
                    if (!success) {
                        jobInfo.error = result.stderr || `Process exited with code ${result.exitCode}`;
                    }

                    this.cleanup(jobId);

                    const jobResult: StreamingJobResult = {
                        success,
                        exitCode: result.exitCode,
                        output: success ? result.stdout : undefined,
                        duration,
                    };

                    this.logger.log(
                        `Streaming job ${jobId} completed: ${success ? 'success' : 'failed'}`
                    );
                    this.emit('jobCompleted', { jobInfo, result: jobResult });

                    resolve(jobResult);
                })
                .catch((error) => {
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }

                    const duration = Date.now() - startTime;
                    jobInfo.status = error.isCanceled ? 'cancelled' : 'failed';
                    jobInfo.error = error.message;

                    this.cleanup(jobId);

                    const jobResult: StreamingJobResult = {
                        success: false,
                        exitCode: error.exitCode,
                        signal: error.signal,
                        error: error.message,
                        duration,
                    };

                    this.logger.error(`Streaming job ${jobId} failed:`, error);
                    this.emit('jobCompleted', { jobInfo, result: jobResult });

                    resolve(jobResult);
                });
        });
    }

    private extractProgress(
        jobId: string,
        output: string,
        onProgress?: (progress: number) => void
    ): void {
        const jobInfo = this.activeJobs.get(jobId);
        if (!jobInfo) return;

        let progress = jobInfo.progress || 0;

        const customExtractor = this.progressExtractors.get(jobId);
        if (customExtractor) {
            const extractedProgress = customExtractor(output);
            if (extractedProgress !== null) {
                progress = extractedProgress;
            }
        }

        if (progress !== jobInfo.progress) {
            jobInfo.progress = progress;
            if (onProgress) {
                onProgress(progress);
            }
            this.emit('jobProgress', { jobId, progress });
        }
    }

    cancelJob(jobId: string): boolean {
        const childProcess = this.processes.get(jobId);
        const jobInfo = this.activeJobs.get(jobId);

        if (!childProcess || !jobInfo) {
            return false;
        }

        try {
            jobInfo.status = 'cancelled';
            childProcess.kill('SIGTERM');

            this.logger.log(`Cancelled streaming job ${jobId}`);
            this.emit('jobCancelled', jobInfo);
            return true;
        } catch (error) {
            this.logger.error(`Failed to cancel streaming job ${jobId}:`, error);
            return false;
        }
    }

    getJobInfo(jobId: string): StreamingJobInfo | undefined {
        return this.activeJobs.get(jobId);
    }

    getAllActiveJobs(): StreamingJobInfo[] {
        return Array.from(this.activeJobs.values());
    }

    getJobsByType(type: string): StreamingJobInfo[] {
        return Array.from(this.activeJobs.values()).filter((job) => job.type === type);
    }

    private cleanup(jobId: string): void {
        this.processes.delete(jobId);
        this.activeJobs.delete(jobId);
        this.progressExtractors.delete(jobId);
    }

    async cleanupAllJobs(): Promise<void> {
        const activeJobIds = Array.from(this.activeJobs.keys());

        for (const jobId of activeJobIds) {
            this.cancelJob(jobId);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        this.processes.clear();
        this.activeJobs.clear();
        this.progressExtractors.clear();

        this.logger.log('Cleaned up all streaming jobs');
    }

    isJobRunning(jobId: string): boolean {
        const jobInfo = this.activeJobs.get(jobId);
        return jobInfo?.status === 'running';
    }

    getJobCount(): number {
        return this.activeJobs.size;
    }

    getJobCountByType(type: string): number {
        return this.getJobsByType(type).length;
    }
}
