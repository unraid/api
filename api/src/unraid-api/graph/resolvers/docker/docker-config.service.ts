import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronExpression } from '@nestjs/schedule';

import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';
import { validateCronExpression } from 'cron';

import { FeatureFlags } from '@app/consts.js';
import { AppError } from '@app/core/errors/app-error.js';
import { DockerConfig } from '@app/unraid-api/graph/resolvers/docker/docker-config.model.js';
import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';

@Injectable()
export class DockerConfigService extends ConfigFilePersister<DockerConfig> {
    constructor(configService: ConfigService) {
        super(configService);
    }

    enabled(): boolean {
        return FeatureFlags.ENABLE_NEXT_DOCKER_RELEASE;
    }

    configKey(): string {
        return 'docker';
    }

    fileName(): string {
        return 'docker.config.json';
    }

    defaultConfig(): DockerConfig {
        return {
            updateCheckCronSchedule: CronExpression.EVERY_DAY_AT_6AM,
            templateMappings: {},
            skipTemplatePaths: [],
        };
    }

    async validate(config: object): Promise<DockerConfig> {
        const dockerConfig = await validateObject(DockerConfig, config);
        const cronExpression = validateCronExpression(dockerConfig.updateCheckCronSchedule);
        if (!cronExpression.valid) {
            throw new AppError(`Cron expression not supported: ${dockerConfig.updateCheckCronSchedule}`);
        }

        return dockerConfig;
    }
}
