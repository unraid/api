import { ProgressExtractor } from '@app/unraid-api/streaming-jobs/streaming-job-manager.service.js';

export const zfsProgressExtractor: ProgressExtractor = (output: string): number | null => {
    const match = output.match(/(\d+(?:\.\d+)?)%/);
    return match ? parseFloat(match[1]) : null;
};

export const flashProgressExtractor: ProgressExtractor = (output: string): number | null => {
    const lines = output.split('\n');
    const totalLines = lines.length;
    if (totalLines > 0) {
        return Math.min(100, (totalLines / 1000) * 100);
    }
    return null;
};

export const createLineCountProgressExtractor = (expectedLines: number): ProgressExtractor => {
    return (output: string): number | null => {
        const lines = output.split('\n').length;
        return Math.min(100, (lines / expectedLines) * 100);
    };
};

export const createPercentageProgressExtractor = (pattern?: RegExp): ProgressExtractor => {
    const defaultPattern = /(\d+(?:\.\d+)?)%/;
    const regex = pattern || defaultPattern;

    return (output: string): number | null => {
        const match = output.match(regex);
        return match ? parseFloat(match[1]) : null;
    };
};
