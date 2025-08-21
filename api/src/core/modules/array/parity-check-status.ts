import type { Var } from '@app/core/types/states/var.js';

export enum ParityCheckStatus {
    NEVER_RUN = 'never_run',
    RUNNING = 'running',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    FAILED = 'failed',
}

export function getParityCheckStatus(varData: Var): ParityCheckStatus {
    const { mdResyncPos, mdResyncDt, sbSyncExit, sbSynced, sbSynced2 } = varData;
    const sbSyncExitNumber = Number(sbSyncExit);

    if (mdResyncPos > 0) {
        return Number(mdResyncDt) > 0 ? ParityCheckStatus.RUNNING : ParityCheckStatus.PAUSED;
    }

    if (sbSynced === 0) {
        return ParityCheckStatus.NEVER_RUN;
    }

    if (sbSyncExitNumber === -4) {
        return ParityCheckStatus.CANCELLED;
    }

    if (sbSyncExitNumber !== 0) {
        return ParityCheckStatus.FAILED;
    }

    if (sbSynced2 > 0) {
        return ParityCheckStatus.COMPLETED;
    }

    return ParityCheckStatus.NEVER_RUN; // fallback
}
