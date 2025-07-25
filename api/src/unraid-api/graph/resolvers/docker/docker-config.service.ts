import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';
import { ValidationError } from 'class-validator';

import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';
import { OrganizerV1 } from '@app/unraid-api/organizer/organizer.dto.js';
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
            views: {},
        };
    }

    async validate(config: object): Promise<OrganizerV1> {
        const organizer = await validateObject(OrganizerV1, config);
        const { isValid, errors } = await validateOrganizerIntegrity(organizer);
        if (!isValid) {
            const error = new ValidationError();
            error.target = organizer;
            error.contexts = errors;
            throw error;
        }
        return organizer;
    }
}
