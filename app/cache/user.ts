import NodeCache from 'node-cache';

export const userCache = new NodeCache();

type URL = string;
type IpAddress = string;
type Status = 'online' | 'offline';

export interface Owner {
	username: string;
	url: URL;
	avatar: URL;
}

export interface CachedServer {
	owner: Owner;
	guid: string;
	apikey: string;
	name: string;
	status: Status;
	wanip: IpAddress;
	lanip: IpAddress;
	localurl: URL;
	remoteurl: string;
}

export interface CachedServers {
	servers: CachedServer[];
}
