import { describe, expect, it, vi } from 'vitest';

import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import * as apiKeyCheckJobs from '@app/mothership/jobs/api-key-check-jobs';
import { type RootState } from '@app/store/index';
import { type RecursivePartial } from '@app/types/index';

describe('apiKeyCheckJob Tests', () => {
    it('API Check Job (with success)', async () => {
        const getState = vi.fn<[], RecursivePartial<RootState>>().mockReturnValue({
            apiKey: { status: API_KEY_STATUS.PENDING_VALIDATION },
            config: {
                remote: { apikey: '_______________________BIG_API_KEY_HERE_________________________' },
            },
            emhttp: { var: { flashGuid: 'my-flash-guid', version: '6.11.5' } },
        });
        const dispatch = vi.fn();
        await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).resolves.toBe(true);
        expect(dispatch).toHaveBeenLastCalledWith({
            payload: API_KEY_STATUS.API_KEY_VALID,
            type: 'apiKey/setApiKeyState',
        });
    });

    it('API Check Job (with invalid length key)', async () => {
        // Setup state
        const getState = vi.fn<[], RecursivePartial<RootState>>().mockReturnValue({
            apiKey: { status: API_KEY_STATUS.PENDING_VALIDATION },
            config: { remote: { apikey: 'too-short-key' } },
            emhttp: { var: { flashGuid: 'my-flash-guid', version: '6.11.5' } },
        });
        const dispatch = vi.fn();
        await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).resolves.toBe(false);
        expect(dispatch).toHaveBeenCalledWith(expect.any(Function));
    });
});
