import { getters } from '@app/store/index';
import { hostname } from 'os';

export const getServerIdentifier = (domain: string | null = null): string => {
    const config = getters.config();
    return `${domain ? domain : ''}-${config.remote.apikey ?? config.upc.apikey}-${
        hostname() ?? 'unknown-hostname'
    }`;
};
