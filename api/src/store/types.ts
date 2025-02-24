import type { Subscription } from 'zen-observable-ts';

import type { ArrayDisk, Share } from '@app/graphql/generated/api/types';
import type { RootState } from '@app/store';
import { type Devices } from '@app/core/types/states/devices';
import { type Networks } from '@app/core/types/states/network';
import { type NfsShares } from '@app/core/types/states/nfs';
import { type Nginx } from '@app/core/types/states/nginx';
import { type SmbShares } from '@app/core/types/states/smb';
import { type Users } from '@app/core/types/states/user';
import { type Var } from '@app/core/types/states/var';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { type DevicesIni } from '@app/store/state-parsers/devices';
import { type NetworkIni } from '@app/store/state-parsers/network';
import { type NfsSharesIni } from '@app/store/state-parsers/nfs';
import { type NginxIni } from '@app/store/state-parsers/nginx';
import { type SharesIni } from '@app/store/state-parsers/shares';
import { type SlotsIni } from '@app/store/state-parsers/slots';
import { type SmbIni } from '@app/store/state-parsers/smb';
import { type UsersIni } from '@app/store/state-parsers/users';
import { type VarIni } from '@app/store/state-parsers/var';

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
    [StateFileKey.shares]: (state: SharesIni) => Array<Share>;
    [StateFileKey.disks]: (state: SlotsIni) => Array<ArrayDisk>;
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

export type DNSCheck =
    | {
          cloudIp: string;
          error: null;
          ttl?: number;
      }
    | { error: Error; cloudIp: null };

export const MOTHERSHIP_CRITICAL_STATUSES: Array<MinigraphStatus> = [
    MinigraphStatus.ERROR_RETRYING,
    MinigraphStatus.PING_FAILURE,
    MinigraphStatus.PRE_INIT,
];

export interface SubscriptionWithSha256 {
    sha256: string;
    subscription: Subscription;
}
export interface SubscriptionWithLastPing extends SubscriptionWithSha256 {
    lastPing: number;
}
