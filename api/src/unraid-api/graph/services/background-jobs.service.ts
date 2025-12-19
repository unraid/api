import { Injectable, Logger } from '@nestjs/common';

import { AppError } from '@app/core/errors/app-error.js';

export interface BackgroundJob<Operation = string, State = string> {
    id: string;
    operation: Operation;
    state: State;
    processed: number;
    total: number;
    error?: string | null;
    meta?: Record<string, unknown>;
}

interface CreateJobOptions<Operation, State> {
    operation: Operation;
    total: number;
    initialState: State;
    prefix?: string;
    meta?: Record<string, unknown>;
}

interface RunJobOptions<State> {
    job: BackgroundJob<unknown, State>;
    work: () => Promise<void>;
    runningState: State;
    successState: State;
    failureState: State;
    logContext?: string;
}

@Injectable()
export class BackgroundJobsService {
    private readonly logger = new Logger(BackgroundJobsService.name);
    private readonly jobs = new Map<string, BackgroundJob>();

    public createJob<Operation, State>(options: CreateJobOptions<Operation, State>) {
        const { operation, total, initialState, prefix, meta } = options;
        const idBase = typeof operation === 'string' ? operation.toLowerCase() : 'job';
        const id = `${prefix ?? idBase}-${Date.now().toString(36)}`;

        const job: BackgroundJob<Operation, State> = {
            id,
            operation,
            state: initialState,
            processed: 0,
            total,
            error: null,
            meta,
        };

        this.jobs.set(job.id, job);
        return job;
    }

    public updateJob<Operation, State>(job: BackgroundJob<Operation, State>) {
        this.jobs.set(job.id, { ...job });
        return this.jobs.get(job.id) as BackgroundJob<Operation, State>;
    }

    public getJob<Operation, State>(jobId: string) {
        const job = this.jobs.get(jobId) as BackgroundJob<Operation, State> | undefined;
        if (!job) {
            throw new AppError(`Background job ${jobId} not found`, 404);
        }
        return job;
    }

    public async runJob<State>(options: RunJobOptions<State>) {
        const { job, work, runningState, successState, failureState, logContext } = options;
        if (job.state === successState) {
            return job;
        }

        job.state = runningState;
        this.updateJob(job);

        try {
            await work();
            job.state = successState;
        } catch (error) {
            job.state = failureState;
            job.error = error instanceof Error ? error.message : 'Unknown error while processing job';
            this.logger.error(
                `[${logContext ?? 'background-job'}] failed ${job.id}: ${job.error}`,
                error as Error
            );
        } finally {
            this.updateJob(job);
        }

        return job;
    }
}
