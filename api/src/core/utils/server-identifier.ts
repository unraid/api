import { getters } from '@app/store/index';
import crypto from 'crypto';
export const getServerIdentifier = (domain: string | null = null): string => {
    const config = getters.config();
    return crypto.createHash('sha256').update(`${domain ? domain : ''}-${config.api.version}-${config.remote.apikey ?? config.upc.apikey}`).digest('hex');
};
