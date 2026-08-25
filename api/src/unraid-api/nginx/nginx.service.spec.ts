import { execa } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NginxService } from '@app/unraid-api/nginx/nginx.service.js';

vi.mock('execa', () => ({
    execa: vi.fn(),
}));

describe('NginxService', () => {
    const mockExeca = vi.mocked(execa);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('coalesces concurrent reload requests', async () => {
        const firstService = new NginxService();
        const secondService = new NginxService();

        const results = await Promise.all([firstService.reload(), secondService.reload()]);

        expect(results).toEqual([true, true]);
        expect(mockExeca).toHaveBeenCalledTimes(1);
        expect(mockExeca).toHaveBeenCalledWith('/etc/rc.d/rc.nginx', ['reload']);
    });

    it('allows a new reload after the previous one completes', async () => {
        const service = new NginxService();

        await service.reload();
        await service.reload();

        expect(mockExeca).toHaveBeenCalledTimes(2);
    });
});
