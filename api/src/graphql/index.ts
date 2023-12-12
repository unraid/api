import { FatalAppError } from '@app/core/errors/fatal-error';
import { modules } from '@app/core';

export const getCoreModule = (moduleName: string) => {
	if (!Object.keys(modules).includes(moduleName)) {
		throw new FatalAppError(`"${moduleName}" is not a valid core module.`);
	}

	return modules[moduleName];
};
