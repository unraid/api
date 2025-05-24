import { Injectable } from '@nestjs/common';

import { convert } from 'convert';

@Injectable()
export class FormatService {
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';

        const result = convert(bytes, 'bytes').to('best');
        return result.toString();
    }

    formatDuration(seconds: number): string {
        if (seconds < 60) return `${seconds}s`;

        const result = convert(seconds, 'seconds').to('best');
        return result.toString();
    }
}
