import { extname } from 'path';

export const getExtensionFromPath = (filePath: string): string => extname(filePath);
