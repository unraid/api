import { readFile } from 'fs/promises';
import { extname } from 'path';
import { readFileSync } from 'fs';
import { fileExistsSync } from '@app/core/utils/files/file-exists';

export const loadFileFromPath = async (filePath: string): Promise<{ fileContents: string; extension: string }> => {
	const { fileExists } = await import('@app/core/utils/files/file-exists');
	if (await fileExists(filePath)) {
		const fileContents = await readFile(filePath, 'utf-8');
		const extension = extname(filePath);
		return { fileContents, extension };
	}

	throw new Error(`Failed to load file at path: ${filePath}`);
};

export const loadFileFromPathSync = (filePath: string): string => {
	if (fileExistsSync(filePath)) {
		const fileContents = readFileSync(filePath, 'utf-8').toString();
		return fileContents;
	}

	throw new Error(`Failed to load file at path: ${filePath}`);
};
