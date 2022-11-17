import { Devices } from '@app/core/types/states/devices';
import { Networks } from '@app/core/types/states/network';
import { NfsShares } from '@app/core/types/states/nfs';
import { Nginx } from '@app/core/types/states/nginx';
import { Shares } from '@app/core/types/states/share';
import { Slots } from '@app/core/types/states/slots';
import { SmbShares } from '@app/core/types/states/smb';
import { Users } from '@app/core/types/states/user';
import { Var } from '@app/core/types/states/var';
import { RootState } from '@app/store';
import { DevicesIni } from './state-parsers/devices';
import { NetworkIni } from './state-parsers/network';
import { NfsSharesIni } from './state-parsers/nfs';
import { NginxIni } from './state-parsers/nginx';
import { SharesIni } from './state-parsers/shares';
import { SlotsIni } from './state-parsers/slots';
import { SmbIni } from './state-parsers/smb';
import { UsersIni } from './state-parsers/users';
import { VarIni } from './state-parsers/var';

export enum FileLoadStatus {
	UNLOADED = 'UNLOADED',
	LOADING = 'LOADING',
	LOADED = 'LOADED',
	FAILED_LOADING = 'FAILED_LOADING',
}

export enum MemoryCacheStatus {
	UNCACHED = 'UNCACHED',
	CACHED = 'CACHED',
}

export enum StateFileKey {
	var = 'var',
	devs = 'devs',
	network = 'network',
	nginx = 'nginx',
	shares = 'shares',
	disks = 'disks',
	users = 'users',
	sec = 'sec',
	sec_nfs = 'sec_nfs',
}

export interface StateFileToIniParserMap {
	[StateFileKey.var]: (state: VarIni) => Var;
	[StateFileKey.devs]: (state: DevicesIni) => Devices;
	[StateFileKey.network]: (state: NetworkIni) => Networks;
	[StateFileKey.nginx]: (state: NginxIni) => Nginx;
	[StateFileKey.shares]: (state: SharesIni) => Shares;
	[StateFileKey.disks]: (state: SlotsIni) => Slots;
	[StateFileKey.users]: (state: UsersIni) => Users;
	[StateFileKey.sec]: (state: SmbIni) => SmbShares;
	[StateFileKey.sec_nfs]: (state: NfsSharesIni) => NfsShares;
}

export enum DaemonConnectionStatus {
	CONNECTED = 'CONNECTED',
	DISCONNECTED = 'DISCONNECTED',
}

export type StoreSubscriptionHandler = (lastState: RootState | null) => Promise<void>;

export enum CacheKeys {
	checkCloud = 'check-cloud',
	checkDns = 'check-dns',
}

export type DNSCheck = {
	cloudIp: string;
	error: null;
} | { error: Error; cloudIp: null };
