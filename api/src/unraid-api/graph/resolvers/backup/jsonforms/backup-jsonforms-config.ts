import type { LabelElement, Layout, SchemaBasedCondition } from '@jsonforms/core';
import { JsonSchema7, RuleEffect } from '@jsonforms/core';

import type { RCloneRemote } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { getDestinationConfigSlice } from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination-jsonforms.config.js';
import { getSourceConfigSlice } from '@app/unraid-api/graph/resolvers/backup/source/backup-source-jsonforms.config.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';

function getBasicBackupConfigSlice(): SettingSlice {
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

export function buildBackupJobConfigSchema({ remotes = [] }: { remotes?: RCloneRemote[] }): {
    dataSchema: { properties: DataSlice; type: 'object' };
    uiSchema: Layout;
} {
    const slicesToMerge: SettingSlice[] = [];

    const basicSlice = getBasicBackupConfigSlice();
    slicesToMerge.push(basicSlice);

    const sourceSlice = getSourceConfigSlice();
    slicesToMerge.push(sourceSlice);

    const destinationSlice = getDestinationConfigSlice({ remotes });
    slicesToMerge.push(destinationSlice);

    const mergedSlices = mergeSettingSlices(slicesToMerge);

    const dataSchema: { properties: DataSlice; type: 'object' } = {
        type: 'object',
        properties: mergedSlices.properties,
    };

    const steps = [
        { label: 'Backup Configuration', description: 'Basic backup job settings' },
        { label: 'Source Configuration', description: 'Configure what to backup' },
        { label: 'Destination Configuration', description: 'Configure where to backup' },
    ];

    const step0Elements = basicSlice.elements;
    const step1Elements = sourceSlice.elements;
    const step2Elements = destinationSlice.elements;

    const steppedLayoutElement: UIElement = {
        type: 'SteppedLayout',
        options: {
            steps: steps,
        },
        elements: [...(step0Elements || []), ...(step1Elements || []), ...(step2Elements || [])].filter(
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
