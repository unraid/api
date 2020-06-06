import NodeCache from 'node-cache';

export const userCache = new NodeCache();

type URL = string;
type IpAddress = string;
type Status = 'online' | 'offline';

export interface CachedUser {
    profile: {
        username: string;
        url: URL;
        avatar: URL;
    },
    servers: [{
        guid: string;
        apikey: string;
        name: string;
        status: Status;
        wanip: IpAddress;
        lanip: IpAddress;
        localurl: URL;
        remoteurl: string
    }]
};