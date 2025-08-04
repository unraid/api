import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';

import { AppError } from '@app/core/errors/app-error.js';
import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';
import {
    DEFAULT_ORGANIZER_ROOT_ID,
    DEFAULT_ORGANIZER_VIEW_ID,
} from '@app/unraid-api/organizer/organizer.js';
import { OrganizerV1 } from '@app/unraid-api/organizer/organizer.model.js';
import { validateOrganizerIntegrity } from '@app/unraid-api/organizer/organizer.validation.js';

@Injectable()
export class DockerConfigService extends ConfigFilePersister<OrganizerV1> {
    constructor(configService: ConfigService) {
        super(configService);
    }

    configKey(): string {
        return 'dockerOrganizer';
    }

    fileName(): string {
        return 'docker.organizer.json';
    }

    defaultConfig(): OrganizerV1 {
        return {
            version: 1,
            resources: {},
            views: {
                default: {
                    id: DEFAULT_ORGANIZER_VIEW_ID,
                    name: 'Default',
                    root: DEFAULT_ORGANIZER_ROOT_ID,
                    entries: {
                        root: {
                            type: 'folder',
                            id: DEFAULT_ORGANIZER_ROOT_ID,
                            name: 'Root',
                            children: [],
                        },
                    },
                },
            },
        };
    }

    async validate(config: object): Promise<OrganizerV1> {
        const organizer = await validateObject(OrganizerV1, config);
        const { isValid, errors } = await validateOrganizerIntegrity(organizer);
        if (!isValid) {
            throw new AppError(`Docker organizer validation failed: ${JSON.stringify(errors, null, 2)}`);
        }
        return organizer;
    }
}
