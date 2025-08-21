import { toNumberAlways } from '@unraid/shared/util/data.js';

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
    const mdResyncDtNumber = toNumberAlways(mdResyncDt, 0);
    const sbSyncExitNumber = toNumberAlways(sbSyncExit, 0);

    if (mdResyncPos > 0) {
        return mdResyncDtNumber > 0 ? ParityCheckStatus.RUNNING : ParityCheckStatus.PAUSED;
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
