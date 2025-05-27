import { JsonSchema7 } from '@jsonforms/core';

import type { RCloneRemote } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import type { SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';

export function getDestinationConfigSlice({ remotes = [] }: { remotes?: RCloneRemote[] }): SettingSlice {
    const destinationConfigElements: UIElement[] = [
        createLabeledControl({
            scope: '#/properties/destinationConfig/properties/remoteName',
            label: 'Remote Configuration',
            description: 'Select the RClone remote configuration to use for this backup',
            controlOptions: {
                suggestions: remotes.map((remote) => ({
                    value: remote.name,
                    label: `${remote.name} (${remote.type})`,
                })),
            },
        }),

        createLabeledControl({
            scope: '#/properties/destinationConfig/properties/destinationPath',
            label: 'Destination Path',
            description: 'The path on the remote where files will be stored (e.g., backups/documents)',
            controlOptions: {
                placeholder: 'backups/',
                format: 'string',
            },
        }),

        createLabeledControl({
            scope: '#/properties/destinationConfig/properties/rcloneOptions/properties/transfers',
            label: 'Number of Transfers',
            description: 'Number of file transfers to run in parallel (default: 4)',
            controlOptions: {
                placeholder: '4',
                format: 'number',
            },
        }),

        createLabeledControl({
            scope: '#/properties/destinationConfig/properties/rcloneOptions/properties/checkers',
            label: 'Number of Checkers',
            description: 'Number of checkers to run in parallel (default: 8)',
            controlOptions: {
                placeholder: '8',
                format: 'number',
            },
        }),
    ];

    const destinationConfigProperties: Record<string, JsonSchema7> = {
        destinationConfig: {
            type: 'object',
            title: 'Destination Configuration',
            description: 'Configuration for backup destination',
            properties: {
                remoteName: {
                    type: 'string',
                    title: 'Remote Name',
                    description: 'Remote name from rclone config',
                    enum:
                        remotes.length > 0
                            ? remotes.map((remote) => remote.name)
                            : ['No remotes configured'],
                },
                destinationPath: {
                    type: 'string',
                    title: 'Destination Path',
                    description: 'Destination path on the remote',
                    minLength: 1,
                },
                rcloneOptions: {
                    type: 'object',
                    title: 'RClone Options',
                    description: 'Advanced RClone configuration options',
                    properties: {
                        transfers: {
                            type: 'integer',
                            title: 'Transfers',
                            description: 'Number of file transfers to run in parallel',
                            minimum: 1,
                            maximum: 100,
                            default: 4,
                        },
                        checkers: {
                            type: 'integer',
                            title: 'Checkers',
                            description: 'Number of checkers to run in parallel',
                            minimum: 1,
                            maximum: 100,
                            default: 8,
                        },
                    },
                },
            },
            required: ['remoteName', 'destinationPath'],
        },
    };

    const verticalLayoutElement: UIElement = {
        type: 'VerticalLayout',
        elements: destinationConfigElements,
        options: { step: 2 },
    };

    return {
        properties: destinationConfigProperties,
        elements: [verticalLayoutElement],
    };
}
