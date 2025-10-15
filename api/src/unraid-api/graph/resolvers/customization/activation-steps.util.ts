import { Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { ActivationOnboardingStepId } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';

export async function findActivationCodeFile(
    activationDir: string,
    extension = '.activationcode',
    logger?: Logger
): Promise<string | null> {
    try {
        await fs.access(activationDir);
        const files = await fs.readdir(activationDir);
        const activationFile = files.find((file) => file.endsWith(extension));
        return activationFile ? path.join(activationDir, activationFile) : null;
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            logger?.debug?.(
                `Activation directory ${activationDir} not found when searching for activation code.`
            );
        } else if (error instanceof Error) {
            logger?.error?.('Error accessing activation directory or reading its content.', error);
        }
        return null;
    }
}

export type ActivationStepContext = {
    hasActivationCode: boolean;
    regState?: string;
};

export type ActivationStepDefinition = {
    id: ActivationOnboardingStepId;
    required: boolean;
    introducedIn: string;
    condition?: (context: ActivationStepContext) => boolean | Promise<boolean>;
};

const activationStepDefinitions: ActivationStepDefinition[] = [
    {
        id: ActivationOnboardingStepId.WELCOME,
        required: false,
        introducedIn: '7.0.0',
    },
    {
        id: ActivationOnboardingStepId.TIMEZONE,
        required: true,
        introducedIn: '7.0.0',
    },
    {
        id: ActivationOnboardingStepId.PLUGINS,
        required: false,
        introducedIn: '7.0.0',
    },
    {
        id: ActivationOnboardingStepId.ACTIVATION,
        required: true,
        introducedIn: '7.0.0',
        condition: (context) =>
            context.hasActivationCode && Boolean(context.regState?.startsWith('ENOKEYFILE')),
    },
];

export async function resolveActivationStepDefinitions(
    context: ActivationStepContext
): Promise<ActivationStepDefinition[]> {
    const results: ActivationStepDefinition[] = [];
    for (const definition of activationStepDefinitions) {
        if (!definition.condition || (await definition.condition(context))) {
            results.push(definition);
        }
    }
    return results;
}
