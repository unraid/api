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

function getStatusFromVarData(varData: Var): ParityCheckStatus {
    const { mdResyncPos, mdResyncDt, sbSyncExit, sbSynced, sbSynced2 } = varData;
    const mdResyncDtNumber = toNumberAlways(mdResyncDt, 0);
    const sbSyncExitNumber = toNumberAlways(sbSyncExit, 0);

    switch (true) {
        case mdResyncPos > 0:
            return mdResyncDtNumber > 0 ? ParityCheckStatus.RUNNING : ParityCheckStatus.PAUSED;
        case sbSynced === 0:
            return ParityCheckStatus.NEVER_RUN;
        case sbSyncExitNumber === -4:
            return ParityCheckStatus.CANCELLED;
        case sbSyncExitNumber !== 0:
            return ParityCheckStatus.FAILED;
        case sbSynced2 > 0:
            return ParityCheckStatus.COMPLETED;
        default:
            return ParityCheckStatus.NEVER_RUN;
    }
}

export function getParityCheckStatus(varData: Var): ParityCheck {
    const { sbSynced, sbSynced2, mdResyncDt, mdResyncDb, mdResyncPos, mdResyncSize } = varData;
    const deltaTime = toNumberAlways(mdResyncDt, 0);
    const deltaBlocks = toNumberAlways(mdResyncDb, 0);

    // seconds since epoch (unix timestamp)
    const now = sbSynced2 > 0 ? sbSynced2 : Date.now() / 1000;
    return {
        status: getStatusFromVarData(varData),
        speed: String(calculateParitySpeed(deltaTime, deltaBlocks)),
        date: sbSynced > 0 ? new Date(sbSynced * 1000) : undefined,
        duration: sbSynced > 0 ? Math.round(now - sbSynced) : undefined,
        // percentage as integer, clamped to [0, 100]
        progress:
            mdResyncSize <= 0
                ? 0
                : Math.round(Math.min(100, Math.max(0, (mdResyncPos / mdResyncSize) * 100))),
    };
}
