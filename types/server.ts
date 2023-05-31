export enum ServerState {
  BASIC = 'BASIC',
  PLUS = 'PLUS',
  PRO = 'PRO',
  TRIAL = 'TRIAL',
  EEXPIRED = 'EEXPIRED',
  ENOKEYFILE = 'ENOKEYFILE',
  EGUID = 'EGUID',
  EGUID1 = 'EGUID1',
  ETRIAL = 'ETRIAL',
  ENOKEYFILE2 = 'ENOKEYFILE2',
  ENOKEYFILE1 = 'ENOKEYFILE1',
  ENOFLASH = 'ENOFLASH',
  EBLACKLISTED = 'EBLACKLISTED',
  EBLACKLISTED1 = 'EBLACKLISTED1',
  EBLACKLISTED2 = 'EBLACKLISTED2',
  ENOCONN = 'ENOCONN',
}
export interface Server {
  // state?: ServerState;
  state?: string;
  name?: string;
  description?: string;
  deviceCount?: number;
  flashProduct?: string;
  flashVendor?: string;
  guid?: string;
  regGuid?: string;
  site?: string;
  wanFQDN?: string;
  regGen?: number;
  license?: string;
  keyfile?: string;
  locale?: string;
  uptime?: number;
  expireTime?: number;
}

export type ServerStateDataActions = 'redeem'|'purchase'|'upgrade'|'signOut'|'signIn'|'trialExtend'|'trialStart'|'replace'|'recover';

export interface ServerStateDataError {
  heading: string;
  message: string;
  reAuthFix: boolean; // @todo potentially remove
}

export interface ServerStateData {
  actions: ServerStateDataActions[];
  humanReadable: string; // @todo create interface of ENUM to string mapping
  heading: string;
  message: string;
  error?: ServerStateDataError;
  withKey?: boolean; // @todo potentially remove
}