import { Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

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

// End of file
