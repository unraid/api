import { type Devices } from '@app/core/types/states/devices';
import { type Networks } from '@app/core/types/states/network';
import { type NfsShares } from '@app/core/types/states/nfs';
import { type Nginx } from '@app/core/types/states/nginx';
import { type Shares } from '@app/core/types/states/share';
import { type Slots } from '@app/core/types/states/slots';
import { type SmbShares } from '@app/core/types/states/smb';
import { type Users } from '@app/core/types/states/user';
import { type Var } from '@app/core/types/states/var';
import type { RootState } from '@app/store';
import { type DevicesIni } from './state-parsers/devices';
import { type NetworkIni } from './state-parsers/network';
import { type NfsSharesIni } from './state-parsers/nfs';
import { type NginxIni } from './state-parsers/nginx';
import { type SharesIni } from './state-parsers/shares';
import { type SlotsIni } from './state-parsers/slots';
import { type SmbIni } from './state-parsers/smb';
import { type UsersIni } from './state-parsers/users';
import { type VarIni } from './state-parsers/var';

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
