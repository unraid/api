import fs from 'node:fs';
import path from 'node:path';
import prettyBytes from 'pretty-bytes';
import { coreLogger } from '../log';

const writeFile = async (filePath: string, fileContents: string | Buffer) => {
	coreLogger.debug(`Writing ${prettyBytes(fileContents.length)} to ${filePath}`);
	await fs.promises.writeFile(filePath, fileContents);
};

export const writeToBoot = async (filePath: string, fileContents: string | Buffer) => {
	const basePath = '/boot/config/plugins/dynamix/';
	const resolvedPath = path.resolve(basePath, filePath);
	await writeFile(resolvedPath, fileContents);
};
