import { Injectable } from '@nestjs/common';

import { convert } from 'convert';

@Injectable()
export class FormatService {
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';

        const result = convert(bytes, 'bytes').to('best');
        const value =
            typeof result.quantity === 'number' ? Number(result.quantity.toFixed(2)) : result.quantity;
        return `${value} ${result.unit}`;
    }

    formatSpeed(bytesPerSecond: number): string {
        if (bytesPerSecond === 0) return '0 B/s';

        const result = convert(bytesPerSecond, 'bytes').to('best');
        const value =
            typeof result.quantity === 'number' ? Number(result.quantity.toFixed(2)) : result.quantity;
        return `${value} ${result.unit}/s`;
    }

    formatDuration(seconds: number): string {
        if (seconds < 60) return `${Math.round(seconds * 100) / 100}s`;

        const result = convert(seconds, 'seconds').to('best');
        const value =
            typeof result.quantity === 'number' ? Number(result.quantity.toFixed(2)) : result.quantity;
        return `${value} ${result.unit}`;
    }
}
