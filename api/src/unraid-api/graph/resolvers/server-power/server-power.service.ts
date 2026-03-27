import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

@Injectable()
export class ServerPowerService {
    private readonly logger = new Logger(ServerPowerService.name);

    /**
     * The -n flag skips a userspace sync in this process before signaling init.
     * This matches webgui's Boot.php behavior. The real shutdown sequence (rc.6)
     * handles all cleanup: stopping the array, unmounting filesystems, syncing,
     * and remounting boot read-only before the final reboot/poweroff (which runs
     * without -n, so the kernel syncs at that point too).
     */

    async reboot(): Promise<boolean> {
        this.logger.log('Server reboot requested via GraphQL');
        await execa('/sbin/reboot', ['-n']);
        return true;
    }

    async shutdown(): Promise<boolean> {
        this.logger.log('Server shutdown requested via GraphQL');
        await execa('/sbin/poweroff', ['-n']);
        return true;
    }
}
