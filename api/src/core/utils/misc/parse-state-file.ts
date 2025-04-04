import { promises as fs } from 'fs';
import { parse } from 'ini';

export const parseStateFile = async (path: string) => {
    const content = await fs.readFile(path, 'utf8');
    return parse(content);
}; 