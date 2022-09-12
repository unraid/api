import NodeCache from 'node-cache';

export const userCache = new NodeCache();

type Url = string;
type IpAddress = string;
type Status = 'online' | 'offline';

export interface Owner {
	username: string;
	url: Url;
	avatar: Url;
}

export interface CachedServer {
	owner: Owner;
	guid: string;
	apikey: string;
	name: string;
	status: Status;
	wanip: IpAddress | null;
	lanip: IpAddress;
	localurl: Url;
	remoteurl: string | null;
}

export interface CachedServers {
	servers: CachedServer[];
}
