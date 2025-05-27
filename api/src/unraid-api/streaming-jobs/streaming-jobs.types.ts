export interface StreamingJobInfo {
    jobId: string;
    processId: number;
    startTime: Date;
    type: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    error?: string;
}
