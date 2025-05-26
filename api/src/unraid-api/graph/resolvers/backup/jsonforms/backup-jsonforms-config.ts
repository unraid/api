import type { LabelElement, Layout, SchemaBasedCondition } from '@jsonforms/core';
import { JsonSchema7, RuleEffect } from '@jsonforms/core';

import type { RCloneRemote } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { BackupType } from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.types.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';

function getBasicBackupConfigSlice({ remotes = [] }: { remotes?: RCloneRemote[] }): SettingSlice {
    const basicConfigElements: UIElement[] = [
        createLabeledControl({
            scope: '#/properties/name',
            label: 'Backup Job Name',
            description: 'A descriptive name for this backup job (e.g., "Weekly Documents Backup")',
            controlOptions: {
                placeholder: 'Enter backup job name',
                format: 'string',
            },
        }),

        createLabeledControl({
            scope: '#/properties/remoteName',
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
            scope: '#/properties/destinationPath',
            label: 'Destination Path',
            description: 'The path on the remote where files will be stored (e.g., backups/documents)',
            controlOptions: {
                placeholder: 'backups/',
                format: 'string',
            },
        }),

        createLabeledControl({
            scope: '#/properties/schedule',
            label: 'Schedule (Cron Expression)',
            description:
                'When to run this backup job. Leave empty for manual execution only. Examples: "0 2 * * *" (daily at 2AM), "0 2 * * 0" (weekly on Sunday at 2AM)',
            controlOptions: {
                placeholder: 'Leave empty for manual backup',
                format: 'string',
                suggestions: [
                    {
                        value: '',
                        label: 'Manual Only',
                        tooltip: 'No automatic schedule - run manually only',
                    },
                    {
                        value: '0 2 * * *',
                        label: 'Daily at 2:00 AM',
                        tooltip: 'Runs every day at 2:00 AM',
                    },
                    {
                        value: '0 2 * * 0',
                        label: 'Weekly (Sunday 2:00 AM)',
                        tooltip: 'Runs every Sunday at 2:00 AM',
                    },
                    {
                        value: '0 9 * * 1',
                        label: 'Mondays at 9:00 AM',
                        tooltip: 'Runs every Monday at 9:00 AM',
                    },
                    {
                        value: '0 0 1 * *',
                        label: 'Monthly (1st day at midnight)',
                        tooltip: 'Runs on the 1st day of every month at midnight',
                    },
                    {
                        value: '0 2 1 * *',
                        label: 'Monthly (1st at 2:00 AM)',
                        tooltip: 'Runs on the 1st of every month at 2:00 AM',
                    },
                    {
                        value: '0 2 * * 1-5',
                        label: 'Weekdays at 2:00 AM',
                        tooltip: 'Runs Monday through Friday at 2:00 AM',
                    },
                ],
            },
        }),

        createLabeledControl({
            scope: '#/properties/enabled',
            label: 'Enable Backup Job',
            description: 'Whether this backup job should run automatically according to the schedule',
            controlOptions: {
                toggle: true,
            },
            rule: {
                effect: RuleEffect.SHOW,
                condition: {
                    scope: '#/properties/schedule',
                    schema: {
                        type: 'string',
                        minLength: 1,
                    },
                } as SchemaBasedCondition,
            },
        }),
    ];

    const basicConfigProperties: Record<string, JsonSchema7> = {
        name: {
            type: 'string',
            title: 'Backup Job Name',
            description: 'Human-readable name for this backup job',
            minLength: 1,
            maxLength: 100,
        },
        remoteName: {
            type: 'string',
            title: 'Remote Name',
            description: 'Remote name from rclone config',
            enum: remotes.length > 0 ? remotes.map((remote) => remote.name) : ['No remotes configured'],
        },
        destinationPath: {
            type: 'string',
            title: 'Destination Path',
            description: 'Destination path on the remote',
            minLength: 1,
        },
        schedule: {
            type: 'string',
            title: 'Cron Schedule',
            description: 'Cron schedule expression (empty for manual execution)',
        },
        enabled: {
            type: 'boolean',
            title: 'Enabled',
            description: 'Whether this backup job is enabled',
            default: true,
        },
        configStep: {
            type: 'object',
            properties: {
                current: { type: 'integer', default: 0 },
                total: { type: 'integer', default: 3 },
            },
            default: { current: 0, total: 3 },
        },
    };

    const verticalLayoutElement: UIElement = {
        type: 'VerticalLayout',
        elements: basicConfigElements,
        options: { step: 0 },
    };

    return {
        properties: basicConfigProperties as unknown as DataSlice,
        elements: [verticalLayoutElement],
    };
}

function getBackupTypeConfigSlice(): SettingSlice {
    const backupTypeElements: UIElement[] = [
        {
            type: 'Label',
            text: 'Backup Configuration',
            options: {
                description: 'Configure the specific settings for your chosen backup type.',
            },
        } as LabelElement,

        createLabeledControl({
            scope: '#/properties/backupType',
            label: 'Backup Type',
            description: 'Select the type of backup to perform',
            controlOptions: {
                suggestions: [
                    {
                        value: BackupType.ZFS,
                        label: 'ZFS Snapshot',
                        tooltip: 'Create ZFS snapshot and stream it',
                    },
                    {
                        value: BackupType.FLASH,
                        label: 'Flash Backup',
                        tooltip: 'Backup Unraid flash drive with git history',
                    },
                    {
                        value: BackupType.SCRIPT,
                        label: 'Custom Script',
                        tooltip: 'Run custom script before backup',
                    },
                    {
                        value: BackupType.RAW,
                        label: 'Raw File Backup',
                        tooltip: 'Direct file/folder backup',
                    },
                ],
            },
        }),

        createLabeledControl({
            scope: '#/properties/backupConfig/properties/timeout',
            label: 'Timeout (seconds)',
            description: 'Maximum time to wait for backup operation to complete (default: 3600 seconds)',
            controlOptions: {
                placeholder: '3600',
                format: 'number',
            },
        }),

        createLabeledControl({
            scope: '#/properties/backupConfig/properties/cleanupOnFailure',
            label: 'Cleanup on Failure',
            description: 'Whether to clean up backup artifacts if the backup fails',
            controlOptions: {
                toggle: true,
            },
        }),

        // Raw Backup Configuration
        {
            type: 'VerticalLayout',
            rule: {
                effect: RuleEffect.SHOW,
                condition: {
                    scope: '#/properties/backupType',
                    schema: { const: BackupType.RAW },
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
                    scope: '#/properties/backupConfig/properties/rawConfig/properties/sourcePath',
                    label: 'Source Path',
                    description: 'The local path to backup (e.g., /mnt/user/Documents)',
                    controlOptions: {
                        placeholder: '/mnt/user/',
                        format: 'string',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/rawConfig/properties/excludePatterns',
                    label: 'Exclude Patterns',
                    description:
                        'File patterns to exclude from backup (one per line, supports wildcards)',
                    controlOptions: {
                        multi: true,
                        placeholder: '*.tmp',
                        format: 'string',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/rawConfig/properties/includePatterns',
                    label: 'Include Patterns',
                    description:
                        'File patterns to specifically include (one per line, supports wildcards)',
                    controlOptions: {
                        multi: true,
                        placeholder: '*.pdf',
                        format: 'string',
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
                    scope: '#/properties/backupType',
                    schema: { const: BackupType.ZFS },
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
                    scope: '#/properties/backupConfig/properties/zfsConfig/properties/poolName',
                    label: 'ZFS Pool Name',
                    description: 'Name of the ZFS pool containing the dataset',
                    controlOptions: {
                        placeholder: 'tank',
                        format: 'string',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/zfsConfig/properties/datasetName',
                    label: 'Dataset Name',
                    description: 'Name of the ZFS dataset to snapshot',
                    controlOptions: {
                        placeholder: 'data/documents',
                        format: 'string',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/zfsConfig/properties/snapshotPrefix',
                    label: 'Snapshot Prefix',
                    description: 'Prefix for snapshot names (default: backup)',
                    controlOptions: {
                        placeholder: 'backup',
                        format: 'string',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/zfsConfig/properties/cleanupSnapshots',
                    label: 'Cleanup Snapshots',
                    description: 'Whether to clean up snapshots after backup',
                    controlOptions: {
                        toggle: true,
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/zfsConfig/properties/retainSnapshots',
                    label: 'Retain Snapshots',
                    description: 'Number of snapshots to retain (0 = keep all)',
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
                    scope: '#/properties/backupType',
                    schema: { const: BackupType.FLASH },
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
                    scope: '#/properties/backupConfig/properties/flashConfig/properties/flashPath',
                    label: 'Flash Path',
                    description: 'Path to the Unraid flash drive (default: /boot)',
                    controlOptions: {
                        placeholder: '/boot',
                        format: 'string',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/flashConfig/properties/includeGitHistory',
                    label: 'Include Git History',
                    description: 'Whether to include git history in the backup',
                    controlOptions: {
                        toggle: true,
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/flashConfig/properties/additionalPaths',
                    label: 'Additional Paths',
                    description: 'Additional paths to include in flash backup (one per line)',
                    controlOptions: {
                        multi: true,
                        placeholder: '/boot/config/plugins',
                        format: 'string',
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
                    scope: '#/properties/backupType',
                    schema: { const: BackupType.SCRIPT },
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
                    scope: '#/properties/backupConfig/properties/scriptConfig/properties/scriptPath',
                    label: 'Script Path',
                    description: 'Full path to the script to execute',
                    controlOptions: {
                        placeholder: '/mnt/user/scripts/backup-prep.sh',
                        format: 'string',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/scriptConfig/properties/scriptArgs',
                    label: 'Script Arguments',
                    description: 'Arguments to pass to the script (one per line)',
                    controlOptions: {
                        multi: true,
                        placeholder: '--verbose',
                        format: 'string',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/scriptConfig/properties/workingDirectory',
                    label: 'Working Directory',
                    description: 'Working directory for script execution',
                    controlOptions: {
                        placeholder: '/tmp',
                        format: 'string',
                    },
                }),

                createLabeledControl({
                    scope: '#/properties/backupConfig/properties/scriptConfig/properties/outputPath',
                    label: 'Output Path',
                    description: 'Path where script should write output files for backup',
                    controlOptions: {
                        placeholder: '/tmp/backup-output',
                        format: 'string',
                    },
                }),
            ],
        },
    ];

    const backupConfigProperties: Record<string, JsonSchema7> = {
        backupType: {
            type: 'string',
            title: 'Backup Type',
            description: 'Type of backup to perform',
            enum: [BackupType.ZFS, BackupType.FLASH, BackupType.SCRIPT, BackupType.RAW],
            default: BackupType.ZFS,
        },
        backupConfig: {
            type: 'object',
            title: 'Backup Configuration',
            description: 'Configuration for backup operation',
            properties: {
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
        },
    };

    const verticalLayoutElement: UIElement = {
        type: 'VerticalLayout',
        elements: backupTypeElements,
    };

    return {
        properties: backupConfigProperties,
        elements: [verticalLayoutElement],
    };
}

function getAdvancedBackupConfigSlice(): SettingSlice {
    const advancedConfigElements: UIElement[] = [
        createLabeledControl({
            scope: '#/properties/rcloneOptions/properties/transfers',
            label: 'Number of Transfers',
            description: 'Number of file transfers to run in parallel (default: 4)',
            controlOptions: {
                placeholder: '4',
                format: 'number',
            },
        }),

        createLabeledControl({
            scope: '#/properties/rcloneOptions/properties/checkers',
            label: 'Number of Checkers',
            description: 'Number of checkers to run in parallel (default: 8)',
            controlOptions: {
                placeholder: '8',
                format: 'number',
            },
        }),

        createLabeledControl({
            scope: '#/properties/rcloneOptions/properties/dryRun',
            label: 'Dry Run',
            description: 'Do a trial run with no permanent changes',
            controlOptions: {
                toggle: true,
            },
        }),

        createLabeledControl({
            scope: '#/properties/rcloneOptions/properties/progress',
            label: 'Show Progress',
            description: 'Show progress during transfer',
            controlOptions: {
                toggle: true,
            },
        }),

        createLabeledControl({
            scope: '#/properties/rcloneOptions/properties/verbose',
            label: 'Verbose Logging',
            description: 'Enable verbose logging for debugging',
            controlOptions: {
                toggle: true,
            },
        }),
    ];

    const rcloneOptionsProperties: Record<string, JsonSchema7> = {
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
        dryRun: {
            type: 'boolean',
            title: 'Dry Run',
            description: 'Do a trial run with no permanent changes',
            default: false,
        },
        progress: {
            type: 'boolean',
            title: 'Show Progress',
            description: 'Show progress during transfer',
            default: true,
        },
        verbose: {
            type: 'boolean',
            title: 'Verbose Logging',
            description: 'Enable verbose logging',
            default: false,
        },
    };

    const configProperties: DataSlice = {
        rcloneOptions: {
            type: 'object',
            title: 'RClone Options',
            description: 'Advanced RClone configuration options',
            properties: rcloneOptionsProperties as unknown as DataSlice,
        } as any,
    };

    const verticalLayoutElement: UIElement = {
        type: 'VerticalLayout',
        elements: advancedConfigElements,
        options: { step: 2, showDividers: true },
    };

    return {
        properties: configProperties,
        elements: [verticalLayoutElement],
    };
}

export function buildBackupJobConfigSchema({ remotes = [] }: { remotes?: RCloneRemote[] }): {
    dataSchema: { properties: DataSlice; type: 'object' };
    uiSchema: Layout;
} {
    const slicesToMerge: SettingSlice[] = [];

    const basicSlice = getBasicBackupConfigSlice({ remotes });
    slicesToMerge.push(basicSlice);

    const backupTypeSlice = getBackupTypeConfigSlice();
    slicesToMerge.push(backupTypeSlice);

    const advancedSlice = getAdvancedBackupConfigSlice();
    if (Object.keys(advancedSlice.properties).length > 0) {
        slicesToMerge.push({ properties: advancedSlice.properties, elements: [] });
    }

    const mergedSlices = mergeSettingSlices(slicesToMerge);

    const dataSchema: { properties: DataSlice; type: 'object' } = {
        type: 'object',
        properties: mergedSlices.properties,
    };

    const steps = [
        { label: 'Backup Configuration', description: 'Basic backup job settings and type selection' },
        {
            label: 'Backup Type Configuration',
            description: 'Configure specific settings for your chosen backup type',
        },
        { label: 'Advanced Options', description: 'RClone-specific settings' },
    ];

    const step0Elements = basicSlice.elements;

    const step1WrapperLayout: UIElement = {
        type: 'VerticalLayout',
        elements: [...(backupTypeSlice.elements || [])],
        options: { step: 1 },
    };

    const step2Elements = advancedSlice.elements;

    const steppedLayoutElement: UIElement = {
        type: 'SteppedLayout',
        options: {
            steps: steps,
        },
        elements: [...(step0Elements || []), step1WrapperLayout, ...(step2Elements || [])].filter(
            (el) => el
        ) as UIElement[],
    };

    const titleLabel: UIElement = {
        type: 'Label',
        text: 'Create Backup Job',
        options: {
            format: 'title',
            description: 'Configure a new scheduled backup job with RClone.',
        },
    };

    const uiSchema: Layout = {
        type: 'VerticalLayout',
        elements: [titleLabel, steppedLayoutElement],
    };

    return { dataSchema, uiSchema };
}
