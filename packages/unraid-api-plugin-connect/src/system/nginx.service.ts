import { Injectable, Logger } from '@nestjs/common';
import { execa } from 'execa';

@Injectable()
export class NginxService {
    private readonly logger = new Logger(NginxService.name);

    async reload() {
        try {
            await execa('/etc/rc.d/rc.nginx', ['reload']);
            return true;
        } catch (err: unknown) {
            this.logger.warn('Failed to restart Nginx with error: ', err);
            return false;
        }
    }
}
