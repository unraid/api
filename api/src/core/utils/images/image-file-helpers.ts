import { getters } from '@app/store/index';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const isImageFile = async (path: string): Promise<boolean> => {
	try {
		const stats = await stat(path);
		if (stats.size < 25) {
			return false;
		}

		return true;
	} catch (error: unknown) {
		return false;
	}
};

export const getCasePathIfPresent = async (): Promise<string | null> => {
	const dynamixBasePath = getters.paths()['dynamix-base'];
	const configFilePath = join(dynamixBasePath, 'case-model.cfg');
	const caseImagePath = join(dynamixBasePath, 'case-model.png');
	try {
		const caseConfig = await readFile(configFilePath, 'utf-8');
		if (caseConfig.includes('.') && await isImageFile(caseImagePath)) {
			return caseImagePath;
		}

		return null;
	} catch (error: unknown) {
		return null;
	}
};

export const getBannerPathIfPresent = async (filename = 'banner.png'): Promise<string | null> => {
	const dynamixBasePath = getters.paths()['dynamix-base'];
	const configFilePath = join(dynamixBasePath, filename);
	if (await isImageFile(configFilePath)) {
		return configFilePath;
	}

	return null;
};
