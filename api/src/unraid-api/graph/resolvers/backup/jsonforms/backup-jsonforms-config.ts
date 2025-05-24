import type { LabelElement, Layout } from '@jsonforms/core';
import { JsonSchema7 } from '@jsonforms/core';

import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';

function getBasicBackupConfigSlice({ remoteNames = [] }: { remoteNames?: string[] }): SettingSlice {
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
            scope: '#/properties/sourcePath',
            label: 'Source Path',
            description: 'The local path to backup (e.g., /mnt/user/Documents)',
            controlOptions: {
                placeholder: '/mnt/user/',
                format: 'string',
            },
        }),

        createLabeledControl({
            scope: '#/properties/remoteName',
            label: 'Remote Configuration',
            description: 'Select the RClone remote configuration to use for this backup',
            controlOptions: {
                suggestions: remoteNames.map((name) => ({
                    value: name,
                    label: name,
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
                'When to run this backup job. Examples: "0 2 * * *" (daily at 2AM), "0 2 * * 0" (weekly on Sunday at 2AM)',
            controlOptions: {
                placeholder: '0 2 * * *',
                format: 'string',
                suggestions: [
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
        }),

        {
            type: 'Label',
            text: 'Advanced Options',
            options: {
                description: 'Optional RClone-specific settings for this backup job.',
            },
        } as LabelElement,

        createLabeledControl({
            scope: '#/properties/showAdvanced',
            label: 'Show Advanced RClone Options',
            description: 'Display additional RClone configuration options',
            controlOptions: {
                toggle: true,
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
        sourcePath: {
            type: 'string',
            title: 'Source Path',
            description: 'Source path to backup',
            minLength: 1,
        },
        remoteName: {
            type: 'string',
            title: 'Remote Name',
            description: 'Remote name from rclone config',
            enum: remoteNames.length > 0 ? remoteNames : ['No remotes configured'],
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
            description: 'Cron schedule expression',
            pattern: '^\\s*(\\S+\\s+){4}\\S+\\s*$',
            errorMessage:
                'Please enter a valid cron expression (5 fields: minute hour day month weekday)',
        },
        enabled: {
            type: 'boolean',
            title: 'Enabled',
            description: 'Whether this backup job is enabled',
            default: true,
        },
        showAdvanced: {
            type: 'boolean',
            title: 'Show Advanced Options',
            description: 'Whether to show advanced RClone options',
            default: false,
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

function getAdvancedBackupConfigSlice({ showAdvanced }: { showAdvanced: boolean }): SettingSlice {
    if (!showAdvanced) {
        return {
            properties: {},
            elements: [],
        };
    }

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
        options: { step: 1, showDividers: true },
    };

    return {
        properties: configProperties,
        elements: [verticalLayoutElement],
    };
}

export function buildBackupJobConfigSchema({
    remoteNames = [],
    showAdvanced = false,
}: {
    remoteNames?: string[];
    showAdvanced?: boolean;
}): {
    dataSchema: { properties: DataSlice; type: 'object' };
    uiSchema: Layout;
} {
    const slicesToMerge: SettingSlice[] = [];

    const basicSlice = getBasicBackupConfigSlice({ remoteNames });
    slicesToMerge.push(basicSlice);

    const advancedSlice = getAdvancedBackupConfigSlice({ showAdvanced });
    if (
        showAdvanced &&
        (advancedSlice.elements.length > 0 || Object.keys(advancedSlice.properties).length > 0)
    ) {
        slicesToMerge.push(advancedSlice);
    }

    const mergedSlices = mergeSettingSlices(slicesToMerge);

    const dataSchema: { properties: DataSlice; type: 'object' } = {
        type: 'object',
        properties: mergedSlices.properties,
    };

    const steps = [{ label: 'Backup Configuration', description: 'Basic backup job settings' }];

    if (showAdvanced) {
        steps.push({ label: 'Advanced Options', description: 'RClone-specific settings' });
    }

    const steppedLayoutElement: UIElement = {
        type: 'SteppedLayout',
        options: {
            steps: steps,
        },
        elements: mergedSlices.elements,
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
