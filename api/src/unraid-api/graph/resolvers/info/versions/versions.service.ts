import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { versions } from 'systeminformation';

import { InfoVersions } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

@Injectable()
export class VersionsService {
    constructor(private readonly configService: ConfigService) {}

    async generateVersions(): Promise<InfoVersions> {
        const unraid = this.configService.get<string>('store.emhttp.var.version') || 'unknown';
        const softwareVersions = await versions();

        return {
            id: 'info/versions',
            unraid,
            ...softwareVersions,
        };
    }
}
