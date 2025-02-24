import { FatalAppError } from '@app/core/errors/fatal-error.js';
import { modules } from '@app/core/index.js';

export const getCoreModule = (moduleName: string) => {
    if (!Object.keys(modules).includes(moduleName)) {
        throw new FatalAppError(`"${moduleName}" is not a valid core module.`);
    }

    return modules[moduleName];
};
