import { toNumberAlways } from '@unraid/shared/util/data.js';

import type { Var } from '@app/core/types/states/var.js';
import type { ParityCheck } from '@app/unraid-api/graph/resolvers/array/parity.model.js';

export enum ParityCheckStatus {
    NEVER_RUN = 'never_run',
    RUNNING = 'running',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    FAILED = 'failed',
}

function calculateParitySpeed(deltaTime: number, deltaBlocks: number) {
    if (deltaTime === 0 || deltaBlocks === 0) return 0;
    const deltaBytes = deltaBlocks * 1024;
    const speedMBps = deltaBytes / deltaTime / 1024 / 1024;
    return Math.round(speedMBps);
}

export function getParityCheckStatus(varData: Var): ParityCheck {
    const { mdResyncPos, mdResyncDt, sbSyncExit, sbSynced, sbSynced2 } = varData;
    const mdResyncDtNumber = toNumberAlways(mdResyncDt, 0);
    const sbSyncExitNumber = toNumberAlways(sbSyncExit, 0);
    let status: ParityCheckStatus;

    // Priority 1: Active operations (highest priority)
    if (mdResyncPos > 0) {
        status = mdResyncDtNumber > 0 ? ParityCheckStatus.RUNNING : ParityCheckStatus.PAUSED;
    }
    // Priority 2: Never run check
    else if (sbSynced === 0) {
        status = ParityCheckStatus.NEVER_RUN;
    }
    // Priority 3: Error conditions
    else if (sbSyncExitNumber === -4) {
        status = ParityCheckStatus.CANCELLED;
    } else if (sbSyncExitNumber !== 0) {
        status = ParityCheckStatus.FAILED;
    }
    // Priority 4: Completed check
    else if (sbSynced2 > 0) {
        status = ParityCheckStatus.COMPLETED;
    }
    // Fallback
    else {
        status = ParityCheckStatus.NEVER_RUN;
    }

    // seconds since epoch (unix timestamp)
    const now = sbSynced2 > 0 ? sbSynced2 : Date.now() / 1000;
    return {
        status,
        speed: String(calculateParitySpeed(mdResyncDtNumber, toNumberAlways(varData.mdResyncDb, 0))),
        progress: mdResyncPos / (varData.mdResyncSize / 100 + 1),
        date: new Date(sbSynced * 1000),
        duration: Math.round(now - sbSynced),
    };
}
