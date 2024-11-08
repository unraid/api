import fs from 'fs';
import path from 'path';
import { logger } from '@app/core/log';
import convert from 'convert';

const writeFile = async (filePath: string, fileContents: string | Buffer) => {
	logger.debug(`Writing ${convert(fileContents.length, 'bytes').to('kilobytes')} to ${filePath}`);
	await fs.promises.writeFile(filePath, fileContents);
};

export const writeToBoot = async (filePath: string, fileContents: string | Buffer) => {
	const basePath = '/boot/config/plugins/dynamix/';
	const resolvedPath = path.resolve(basePath, filePath);
	await writeFile(resolvedPath, fileContents);
};
