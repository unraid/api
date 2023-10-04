import { request } from '~/composables/services/request';

const KeyServer = request.url('https://keys.lime-technology.com');

export interface StartTrialPayload {
  guid: string;
  timestamp: number; // timestamp in seconds
}
export interface StartTrialResponse {
  license?: string;
  trial?: string
}
export const startTrial = (payload: StartTrialPayload) => KeyServer
  .url('/account/trial')
  .formUrl(payload)
  .post();

export interface ValidateGuidResponse {
  hasNewerKeyfile : boolean;
  purchaseable: true;
  registered: false;
  replaceable: false;
  upgradeable: false;
  upgradeAllowed: 'pro' | 'plus' | 'unleashed' | 'lifetime'[];
  updatesRenewable: false;
}
export interface ValidateGuidPayload {
  guid: string;
  keyfile?: string;
}
export const validateGuid = (payload: ValidateGuidPayload) => KeyServer
  .url('/validate/guid')
  .formUrl(payload)
  .post();

export interface KeyLatestPayload {
  keyfile: string;
}
export interface KeyLatestResponse {
  license: string;
}
export const keyLatest = (payload: KeyLatestPayload) => KeyServer
  .url('/key/latest')
  .formUrl(payload)
  .post();