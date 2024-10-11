import { extname } from 'node:path';

export const getExtensionFromPath = (filePath: string): string => extname(filePath);
