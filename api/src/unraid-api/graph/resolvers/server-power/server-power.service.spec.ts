import { execa } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerPowerService } from '@app/unraid-api/graph/resolvers/server-power/server-power.service.js';

vi.mock('execa', () => ({
    execa: vi.fn(),
}));

describe('ServerPowerService', () => {
    let service: ServerPowerService;

    beforeEach(() => {
        service = new ServerPowerService();
        vi.clearAllMocks();
    });

    describe('reboot', () => {
        it('calls /sbin/reboot with -n flag', async () => {
            vi.mocked(execa).mockResolvedValueOnce({} as Awaited<ReturnType<typeof execa>>);

            const result = await service.reboot();

            expect(result).toBe(true);
            expect(execa).toHaveBeenCalledWith('/sbin/reboot', ['-n']);
        });

        it('throws when exec fails', async () => {
            vi.mocked(execa).mockRejectedValueOnce(new Error('exec failed'));

            await expect(service.reboot()).rejects.toThrow();
        });
    });

    describe('shutdown', () => {
        it('calls /sbin/poweroff with -n flag', async () => {
            vi.mocked(execa).mockResolvedValueOnce({} as Awaited<ReturnType<typeof execa>>);

            const result = await service.shutdown();

            expect(result).toBe(true);
            expect(execa).toHaveBeenCalledWith('/sbin/poweroff', ['-n']);
        });

        it('throws when exec fails', async () => {
            vi.mocked(execa).mockRejectedValueOnce(new Error('exec failed'));

            await expect(service.shutdown()).rejects.toThrow();
        });
    });
});
