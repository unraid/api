import { Injectable } from '@nestjs/common';
import type { ReadStream } from 'node:fs';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

import {
    getBannerPathIfPresent,
    getCasePathIfPresent,
} from '@app/core/utils/images/image-file-helpers.js';

export type CustomizationType = 'banner' | 'case';

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml',
};

@Injectable()
export class RestService {
    async getCustomizationPath(type: CustomizationType): Promise<string | null> {
        switch (type) {
            case 'banner':
                return getBannerPathIfPresent();
            case 'case':
                return getCasePathIfPresent();
        }
    }

    private looksLikeSvg(buffer: Buffer): boolean {
        const content = buffer.toString('utf8').trimStart();
        return content.startsWith('<svg') || content.startsWith('<?xml');
    }

    private detectContentTypeFromBuffer(buffer: Buffer): string {
        if (buffer.length >= 8) {
            if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
                return 'image/png';
            }

            if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
                return 'image/jpeg';
            }

            if (
                buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
                buffer.subarray(8, 12).toString('ascii') === 'WEBP'
            ) {
                return 'image/webp';
            }
        }

        if (buffer.length >= 6 && buffer.subarray(0, 6).toString('ascii') === 'GIF87a') {
            return 'image/gif';
        }

        if (buffer.length >= 6 && buffer.subarray(0, 6).toString('ascii') === 'GIF89a') {
            return 'image/gif';
        }

        if (this.looksLikeSvg(buffer.subarray(0, 1024))) {
            return 'image/svg+xml';
        }

        return 'application/octet-stream';
    }

    private async detectContentType(path: string): Promise<string> {
        const fileContents = await readFile(path);
        const signatureType = this.detectContentTypeFromBuffer(fileContents);
        if (signatureType !== 'application/octet-stream') {
            return signatureType;
        }

        const extension = extname(path).toLowerCase();
        return EXTENSION_CONTENT_TYPES[extension] ?? 'application/octet-stream';
    }

    async getCustomizationStream(type: CustomizationType): Promise<{
        stream: ReadStream;
        contentType: string;
    }> {
        const path = await this.getCustomizationPath(type);
        if (!path) {
            throw new Error(`No ${type} found`);
        }

        const stream = createReadStream(path);
        const contentType = await this.detectContentType(path);
        return { stream, contentType };
    }
}
