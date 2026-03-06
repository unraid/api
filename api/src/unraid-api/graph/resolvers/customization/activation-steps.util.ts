import { Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

const withLegacyActivationDir = (activationDir: string): string => {
    if (activationDir.endsWith('/activate')) {
        return `${activationDir.slice(0, -'/activate'.length)}/activation`;
    }
    if (activationDir.endsWith('/activation')) {
        return `${activationDir.slice(0, -'/activation'.length)}/activate`;
    }
    return `${activationDir}/activate`;
};

export const getActivationDirCandidates = (activationDir: string): string[] => {
    const legacyDir = withLegacyActivationDir(activationDir);
    return Array.from(new Set([activationDir, legacyDir]));
};

export async function findActivationCodeFile(
    activationDir: string,
    extension = '.activationcode',
    logger?: Logger
): Promise<string | null> {
    const candidateDirs = getActivationDirCandidates(activationDir);
    return findActivationCodeFileInDirs(candidateDirs, extension, logger);
}

export async function findActivationCodeFileInDirs(
    activationDirs: string[],
    extension = '.activationcode',
    logger?: Logger
): Promise<string | null> {
    try {
        for (const activationDir of activationDirs) {
            try {
                await fs.access(activationDir);
                const files = await fs.readdir(activationDir);
                const activationFile = files.find((file) => file.endsWith(extension));
                if (activationFile) {
                    return path.join(activationDir, activationFile);
                }
            } catch (innerError) {
                if (
                    innerError instanceof Error &&
                    'code' in innerError &&
                    innerError.code === 'ENOENT'
                ) {
                    logger?.debug?.(
                        `Activation directory ${activationDir} not found when searching for activation code.`
                    );
                    continue;
                }
                if (innerError instanceof Error) {
                    logger?.error?.(
                        `Error accessing activation directory ${activationDir} or reading its content.`,
                        innerError
                    );
                }
            }
        }
        return null;
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            logger?.debug?.(`Activation directories not found when searching for activation code.`);
        } else if (error instanceof Error) {
            logger?.error?.('Error accessing activation directories or reading their content.', error);
        }
        return null;
    }
}

export type ActivationStepContext = {
    hasActivationCode: boolean;
    regState?: string;
};

// End of file
