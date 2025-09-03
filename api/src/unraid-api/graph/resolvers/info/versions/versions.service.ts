import { Injectable } from '@nestjs/common';

import { InfoVersions } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

@Injectable()
export class VersionsService {
    generateVersions(): Partial<InfoVersions> {
        return {
            id: 'info/versions',
        };
    }
}
