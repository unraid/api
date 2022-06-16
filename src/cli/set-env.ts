import { cliLogger } from '../core/log';

export const setEnv = (envName: string, value: any) => {
	process.env[envName] = String(value);
	cliLogger.debug(`Setting process.env[${envName}] = ${value as string}`);
};
