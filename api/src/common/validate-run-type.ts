import { ValidationError } from 'runtypes';
import type { RuntypeBase } from 'runtypes/lib/runtype';

export const validateRunType = <T = unknown>(runType: RuntypeBase, data: T): T => {
	try {
		return runType.check(data) as T;
	} catch (error: unknown) {
		if ((error as ValidationError).details) throw new Error(JSON.stringify((error as ValidationError).details));
		throw error;
	}
};
