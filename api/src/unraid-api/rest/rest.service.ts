import { Injectable } from '@nestjs/common';
import type { ReadStream } from 'node:fs';
import { createReadStream } from 'node:fs';

import { getBannerPathIfPresent, getCasePathIfPresent } from '@app/core/utils/images/image-file-helpers.js';

@Injectable()
export class RestService {
    async getCustomizationPath(type: 'banner' | 'case'): Promise<string | null> {
        switch (type) {
            case 'banner':
                return getBannerPathIfPresent();
            case 'case':
                return getCasePathIfPresent();
        }
    }

    async getCustomizationStream(type: 'banner' | 'case'): Promise<ReadStream> {
        const path = await this.getCustomizationPath(type);
        if (!path) {
            throw new Error(`No ${type} found`);
        }
        return createReadStream(path);
    }
}
