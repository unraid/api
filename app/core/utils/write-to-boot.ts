import fs from 'fs';
import path from 'path';
import prettyBytes from 'pretty-bytes';
import { log } from '../log';

const writeFile = (filePath: string, fileContents: string | Buffer) => {
    log.debug(`Writing ${prettyBytes(fileContents.length)} to ${filePath}`);
    fs.promises.writeFile(filePath, fileContents);
}

export const writeToBoot = (filePath: string, fileContents: string | Buffer) => {
    const basePath = `/boot/config/plugins/dynamix/`;
    const resolvedPath = path.resolve(basePath, filePath);
    return writeFile(resolvedPath, fileContents);
};
