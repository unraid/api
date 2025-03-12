import { Injectable } from '@nestjs/common';

import { execa } from 'execa';

@Injectable()
export class ConnectService {
    async restart() {
        return execa('unraid-api', ['restart'], { shell: 'bash' });
    }
}
