import type { LabelElement, SchemaBasedCondition } from '@jsonforms/core';
import { JsonSchema7, RuleEffect } from '@jsonforms/core';

import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { SourceType } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';

export function getSourceConfigSlice(): SettingSlice {
    const sourceConfigElements: UIElement[] = [
        {
            type: 'Control',
            scope: '#/properties/sourceConfig/properties/type',
            options: {
                format: 'radio',
                radioLayout: 'horizontal',
                options: [
                    {
                        label: 'ZFS Snapshot',
                        value: SourceType.ZFS,
                        description: 'Create ZFS snapshot and backup',
                    },
                    {
                        label: 'Flash Drive',
                        value: SourceType.FLASH,
                        description: 'Backup flash drive contents',
                    },
                    {
                        label: 'Custom Script',
                        value: SourceType.SCRIPT,
                        description: 'Run custom script to generate backup data',
                    },
                    {
                        label: 'Raw Files',
                        value: SourceType.RAW,
                        description: 'Direct file backup without preprocessing',
                    },
                ],
            },
        },

        createLabeledControl({
            scope: '#/properties/sourceConfig/properties/timeout',
            label: 'Timeout',
            description: 'Timeout in seconds for backup operation',
            controlOptions: {
                placeholder: '3600',
                format: 'number',
            },
        }),

        createLabeledControl({
            scope: '#/properties/sourceConfig/properties/cleanupOnFailure',
            label: 'Cleanup on Failure',
            description: 'Clean up backup artifacts on failure',
            controlOptions: {
                format: 'toggle',
            },
        }),

        // Raw Backup Configuration
        {
            type: 'VerticalLayout',
            rule: {
                effect: RuleEffect.SHOW,
                condition: {
                    scope: '#/properties/sourceConfig/properties/type',
                    schema: { const: SourceType.RAW },
                } as SchemaBasedCondition,
            },
            elements: [
                {
                    type: 'Label',
                    text: 'Raw Backup Configuration',
                    options: {
                        description: 'Configure direct file/folder backup settings.',
                    },
                } as LabelElement,

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/rawConfig/properties/sourcePath',
                    label: 'Source Path',
                    description: 'Source path to backup',
                    controlOptions: {
                        placeholder: '/mnt/user/data',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/rawConfig/properties/excludePatterns',
                    label: 'Exclude Patterns',
                    description: 'Patterns to exclude from backup',
                    controlOptions: {
                        placeholder: '*.tmp,*.log',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/rawConfig/properties/includePatterns',
                    label: 'Include Patterns',
                    description: 'Patterns to include in backup',
                    controlOptions: {
                        placeholder: '*.txt,*.doc',
                    },
                }),
            ],
        },

        // ZFS Configuration
        {
            type: 'VerticalLayout',
            rule: {
                effect: RuleEffect.SHOW,
                condition: {
                    scope: '#/properties/sourceConfig/properties/type',
                    schema: { const: SourceType.ZFS },
                } as SchemaBasedCondition,
            },
            elements: [
                {
                    type: 'Label',
                    text: 'ZFS Configuration',
                    options: {
                        description: 'Configure ZFS snapshot settings for backup.',
                    },
                } as LabelElement,

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/zfsConfig/properties/poolName',
                    label: 'Pool Name',
                    description: 'ZFS pool name',
                    controlOptions: {
                        placeholder: 'tank',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/zfsConfig/properties/datasetName',
                    label: 'Dataset Name',
                    description: 'ZFS dataset name',
                    controlOptions: {
                        placeholder: 'data',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/zfsConfig/properties/snapshotPrefix',
                    label: 'Snapshot Prefix',
                    description: 'Prefix for snapshot names',
                    controlOptions: {
                        placeholder: 'backup',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/zfsConfig/properties/cleanupSnapshots',
                    label: 'Cleanup Snapshots',
                    description: 'Clean up snapshots after backup',
                    controlOptions: {
                        format: 'checkbox',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/zfsConfig/properties/retainSnapshots',
                    label: 'Retain Snapshots',
                    description: 'Number of snapshots to retain',
                    controlOptions: {
                        placeholder: '5',
                        format: 'number',
                    },
                }),
            ],
        },

        // Flash Configuration
        {
            type: 'VerticalLayout',
            rule: {
                effect: RuleEffect.SHOW,
                condition: {
                    scope: '#/properties/sourceConfig/properties/type',
                    schema: { const: SourceType.FLASH },
                } as SchemaBasedCondition,
            },
            elements: [
                {
                    type: 'Label',
                    text: 'Flash Backup Configuration',
                    options: {
                        description: 'Configure Unraid flash drive backup settings.',
                    },
                } as LabelElement,

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/flashConfig/properties/flashPath',
                    label: 'Flash Path',
                    description: 'Path to flash drive',
                    controlOptions: {
                        placeholder: '/boot',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/flashConfig/properties/includeGitHistory',
                    label: 'Include Git History',
                    description: 'Include git history in backup',
                    controlOptions: {
                        format: 'checkbox',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/flashConfig/properties/additionalPaths',
                    label: 'Additional Paths',
                    description: 'Additional paths to include',
                    controlOptions: {
                        placeholder: '/etc/config',
                    },
                }),
            ],
        },

        // Script Configuration
        {
            type: 'VerticalLayout',
            rule: {
                effect: RuleEffect.SHOW,
                condition: {
                    scope: '#/properties/sourceConfig/properties/type',
                    schema: { const: SourceType.SCRIPT },
                } as SchemaBasedCondition,
            },
            elements: [
                {
                    type: 'Label',
                    text: 'Custom Script Configuration',
                    options: {
                        description: 'Configure custom script execution settings.',
                    },
                } as LabelElement,

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/scriptConfig/properties/scriptPath',
                    label: 'Script Path',
                    description: 'Path to script file',
                    controlOptions: {
                        placeholder: '/usr/local/bin/backup.sh',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/scriptConfig/properties/scriptArgs',
                    label: 'Script Arguments',
                    description: 'Arguments for script',
                    controlOptions: {
                        placeholder: '--verbose --compress',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/scriptConfig/properties/workingDirectory',
                    label: 'Working Directory',
                    description: 'Working directory for script',
                    controlOptions: {
                        placeholder: '/tmp',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/sourceConfig/properties/scriptConfig/properties/outputPath',
                    label: 'Output Path',
                    description: 'Path for script output',
                    controlOptions: {
                        placeholder: '/tmp/backup.tar.gz',
                    },
                }),
            ],
        },
    ];

    const sourceConfigProperties: Record<string, JsonSchema7> = {
        sourceConfig: {
            type: 'object',
            title: 'Source Configuration',
            description: 'Configuration for backup source',
            properties: {
                type: {
                    type: 'string',
                    title: 'Backup Type',
                    description: 'Type of backup to perform',
                    enum: [SourceType.ZFS, SourceType.FLASH, SourceType.SCRIPT, SourceType.RAW],
                    default: SourceType.ZFS,
                },
                timeout: {
                    type: 'integer',
                    title: 'Timeout',
                    description: 'Timeout in seconds for backup operation',
                    minimum: 30,
                    maximum: 86400,
                    default: 3600,
                },
                cleanupOnFailure: {
                    type: 'boolean',
                    title: 'Cleanup on Failure',
                    description: 'Clean up backup artifacts on failure',
                    default: true,
                },
                rawConfig: {
                    type: 'object',
                    title: 'Raw Backup Configuration',
                    properties: {
                        sourcePath: {
                            type: 'string',
                            title: 'Source Path',
                            description: 'Source path to backup',
                            minLength: 1,
                        },
                        excludePatterns: {
                            type: 'array',
                            title: 'Exclude Patterns',
                            description: 'Patterns to exclude from backup',
                            items: {
                                type: 'string',
                            },
                            default: [],
                        },
                        includePatterns: {
                            type: 'array',
                            title: 'Include Patterns',
                            description: 'Patterns to include in backup',
                            items: {
                                type: 'string',
                            },
                            default: [],
                        },
                    },
                    required: ['sourcePath'],
                },
                zfsConfig: {
                    type: 'object',
                    title: 'ZFS Configuration',
                    properties: {
                        poolName: {
                            type: 'string',
                            title: 'Pool Name',
                            description: 'ZFS pool name',
                            minLength: 1,
                        },
                        datasetName: {
                            type: 'string',
                            title: 'Dataset Name',
                            description: 'ZFS dataset name',
                            minLength: 1,
                        },
                        snapshotPrefix: {
                            type: 'string',
                            title: 'Snapshot Prefix',
                            description: 'Prefix for snapshot names',
                            default: 'backup',
                        },
                        cleanupSnapshots: {
                            type: 'boolean',
                            title: 'Cleanup Snapshots',
                            description: 'Clean up snapshots after backup',
                            default: true,
                        },
                        retainSnapshots: {
                            type: 'integer',
                            title: 'Retain Snapshots',
                            description: 'Number of snapshots to retain',
                            minimum: 0,
                            default: 5,
                        },
                    },
                    required: ['poolName', 'datasetName'],
                },
                flashConfig: {
                    type: 'object',
                    title: 'Flash Configuration',
                    properties: {
                        flashPath: {
                            type: 'string',
                            title: 'Flash Path',
                            description: 'Path to flash drive',
                            default: '/boot',
                        },
                        includeGitHistory: {
                            type: 'boolean',
                            title: 'Include Git History',
                            description: 'Include git history in backup',
                            default: true,
                        },
                        additionalPaths: {
                            type: 'array',
                            title: 'Additional Paths',
                            description: 'Additional paths to include',
                            items: {
                                type: 'string',
                            },
                            default: [],
                        },
                    },
                },
                scriptConfig: {
                    type: 'object',
                    title: 'Script Configuration',
                    properties: {
                        scriptPath: {
                            type: 'string',
                            title: 'Script Path',
                            description: 'Path to script file',
                            minLength: 1,
                        },
                        scriptArgs: {
                            type: 'array',
                            title: 'Script Arguments',
                            description: 'Arguments for script',
                            items: {
                                type: 'string',
                            },
                            default: [],
                        },
                        workingDirectory: {
                            type: 'string',
                            title: 'Working Directory',
                            description: 'Working directory for script',
                            default: '/tmp',
                        },
                        outputPath: {
                            type: 'string',
                            title: 'Output Path',
                            description: 'Path for script output',
                            minLength: 1,
                        },
                    },
                    required: ['scriptPath', 'outputPath'],
                },
            },
            required: ['type'],
        },
    };

    // Apply conditional logic for sourceConfig
    if (sourceConfigProperties.sourceConfig && typeof sourceConfigProperties.sourceConfig === 'object') {
        sourceConfigProperties.sourceConfig.allOf = [
            {
                if: { properties: { type: { const: SourceType.RAW } }, required: ['type'] },
                then: {
                    required: ['rawConfig'],
                    properties: {
                        zfsConfig: { not: {} },
                        flashConfig: { not: {} },
                        scriptConfig: { not: {} },
                    },
                },
            },
            {
                if: { properties: { type: { const: SourceType.ZFS } }, required: ['type'] },
                then: {
                    required: ['zfsConfig'],
                    properties: {
                        rawConfig: { not: {} },
                        flashConfig: { not: {} },
                        scriptConfig: { not: {} },
                    },
                },
            },
            {
                if: { properties: { type: { const: SourceType.FLASH } }, required: ['type'] },
                then: {
                    required: ['flashConfig'],
                    properties: {
                        rawConfig: { not: {} },
                        zfsConfig: { not: {} },
                        scriptConfig: { not: {} },
                    },
                },
            },
            {
                if: { properties: { type: { const: SourceType.SCRIPT } }, required: ['type'] },
                then: {
                    required: ['scriptConfig'],
                    properties: {
                        rawConfig: { not: {} },
                        zfsConfig: { not: {} },
                        flashConfig: { not: {} },
                    },
                },
            },
        ];
    }

    const verticalLayoutElement: UIElement = {
        type: 'VerticalLayout',
        elements: sourceConfigElements,
        options: { step: 1 },
    };

    return {
        properties: sourceConfigProperties,
        elements: [verticalLayoutElement],
    };
}
