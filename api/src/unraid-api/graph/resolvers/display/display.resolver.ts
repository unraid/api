import { Query, Resolver, Subscription } from '@nestjs/graphql';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { Display } from '@app/graphql/generated/api/types.js';
import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { Resource } from '@app/graphql/generated/api/types.js';
import { getters } from '@app/store/index.js';

const states = {
    // Success
    custom: {
        url: '',
        icon: 'custom',
        error: '',
        base64: '',
    },
    default: {
        url: '',
        icon: 'default',
        error: '',
        base64: '',
    },

    // Errors
    couldNotReadConfigFile: {
        url: '',
        icon: 'custom',
        error: 'could-not-read-config-file',
        base64: '',
    },
    couldNotReadImage: {
        url: '',
        icon: 'custom',
        error: 'could-not-read-image',
        base64: '',
    },
    imageMissing: {
        url: '',
        icon: 'custom',
        error: 'image-missing',
        base64: '',
    },
    imageTooBig: {
        url: '',
        icon: 'custom',
        error: 'image-too-big',
        base64: '',
    },
    imageCorrupt: {
        url: '',
        icon: 'custom',
        error: 'image-corrupt',
        base64: '',
    },
};

@Resolver('Display')
export class DisplayResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DISPLAY,
        possession: AuthPossession.ANY,
    })
    public async display(): Promise<Display> {
        /**
         * This is deprecated, remove it eventually
         */
        const dynamixBasePath = getters.paths()['dynamix-base'];
        const configFilePath = join(dynamixBasePath, 'case-model.cfg');
        const result = {
            id: 'display',
        };

        // If the config file doesn't exist then it's a new OS install
        // Default to "default"
        if (!existsSync(configFilePath)) {
            return { case: states.default, ...result };
        }

        // Attempt to get case from file
        const serverCase = await readFile(configFilePath)
            .then((buffer) => buffer.toString().split('\n')[0])
            .catch(() => 'error_reading_config_file');

        // Config file can't be read, maybe a permissions issue?
        if (serverCase === 'error_reading_config_file') {
            return { case: states.couldNotReadConfigFile, ...result };
        }

        // Blank cfg file?
        if (serverCase.trim().length === 0) {
            return {
                case: states.default,
                ...result,
            };
        }

        // Non-custom icon
        return {
            case: {
                ...states.default,
                icon: serverCase,
            },
            ...result,
        };
    }

    @Subscription('display')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DISPLAY,
        possession: AuthPossession.ANY,
    })
    public async displaySubscription() {
        return createSubscription(PUBSUB_CHANNEL.DISPLAY);
    }
}
