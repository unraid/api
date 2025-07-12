import type { LabelElement, SchemaBasedCondition } from '@jsonforms/core';
import { JsonSchema7, RuleEffect } from '@jsonforms/core';

import type { RCloneRemote } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import type { SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { DestinationType } from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination.types.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';

export function getDestinationConfigSlice({ remotes = [] }: { remotes?: RCloneRemote[] }): SettingSlice {
    const destinationConfigElements: UIElement[] = [
        {
            type: 'Control',
            scope: '#/properties/destinationConfig/properties/type',
            options: {
                format: 'radio',
                radioLayout: 'horizontal',
                options: [
                    {
                        label: 'RClone Remote',
                        value: DestinationType.RCLONE,
                        description: 'Backup to cloud storage via RClone',
                    },
                ],
            },
        },

        // RClone Configuration
        {
            type: 'VerticalLayout',
            rule: {
                effect: RuleEffect.SHOW,
                condition: {
                    scope: '#/properties/destinationConfig/properties/type',
                    schema: { const: DestinationType.RCLONE },
                } as SchemaBasedCondition,
            },
            elements: [
                {
                    type: 'Label',
                    text: 'RClone Configuration',
                    options: {
                        description: 'Configure RClone remote destination settings.',
                    },
                } as LabelElement,

                createLabeledControl({
                    scope: '#/properties/destinationConfig/properties/rcloneConfig/properties/remoteName',
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
                    scope: '#/properties/destinationConfig/properties/rcloneConfig/properties/destinationPath',
                    label: 'Destination Path',
                    description:
                        'The path on the remote where files will be stored (e.g., backups/documents)',
                    controlOptions: {
                        placeholder: 'backups/',
                        format: 'string',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/destinationConfig/properties/rcloneConfig/properties/rcloneOptions/properties/transfers',
                    label: 'Number of Transfers',
                    description: 'Number of file transfers to run in parallel (default: 4)',
                    controlOptions: {
                        placeholder: '4',
                        format: 'number',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/destinationConfig/properties/rcloneConfig/properties/rcloneOptions/properties/checkers',
                    label: 'Number of Checkers',
                    description: 'Number of checkers to run in parallel (default: 8)',
                    controlOptions: {
                        placeholder: '8',
                        format: 'number',
                    },
                }),
            ],
        },
    ];

    const destinationConfigProperties: Record<string, JsonSchema7> = {
        destinationConfig: {
            type: 'object',
            title: 'Destination Configuration',
            description: 'Configuration for backup destination',
            properties: {
                type: {
                    type: 'string',
                    title: 'Destination Type',
                    description: 'Type of destination to use for backup',
                    enum: [DestinationType.RCLONE],
                    default: DestinationType.RCLONE,
                },
                rcloneConfig: {
                    type: 'object',
                    title: 'RClone Configuration',
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
            },
            required: ['type'],
        },
    };

    // Apply conditional logic for destinationConfig
    if (
        destinationConfigProperties.destinationConfig &&
        typeof destinationConfigProperties.destinationConfig === 'object'
    ) {
        destinationConfigProperties.destinationConfig.allOf = [
            {
                if: { properties: { type: { const: DestinationType.RCLONE } }, required: ['type'] },
                then: {
                    required: ['rcloneConfig'],
                },
            },
        ];
    }

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
