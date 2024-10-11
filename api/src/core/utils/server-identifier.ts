import { getters } from '@app/store/index';
import crypto from 'node:crypto';
import { hostname } from 'node:os';
export const getServerIdentifier = (): string => {
    const flashGuid = getters.emhttp()?.var?.flashGuid ?? 'FLASH_GUID_NOT_FOUND';
    return crypto
        .createHash('sha256')
        .update(`${flashGuid}-${hostname()}`)
        .digest('hex');
};

export const serverIdentifierMatches = (serverIdentifier: string): boolean => {
    return serverIdentifier === getServerIdentifier();
}
