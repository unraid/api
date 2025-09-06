import { request } from '~/composables/services/request';

const KeyServer = request.url('https://keys.lime-technology.com');

export interface StartTrialPayload {
  guid: string;
  timestamp: number; // timestamp in seconds
}
export interface StartTrialResponse {
  license?: string;
  trial?: string;
}
export const startTrial = async (payload: StartTrialPayload): Promise<StartTrialResponse> =>
  await KeyServer.url('/account/trial').formUrl(payload).post().json();

export interface ValidateGuidResponse {
  hasNewerKeyfile: boolean;
  linked: boolean;
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
export const validateGuid = async (payload: ValidateGuidPayload): Promise<ValidateGuidResponse> =>
  await KeyServer.url('/validate/guid').formUrl(payload).post().json();

export interface KeyLatestPayload {
  keyfile: string;
}
export interface KeyLatestResponse {
  license: string;
}
export const keyLatest = async (payload: KeyLatestPayload): Promise<KeyLatestResponse> =>
  await KeyServer.url('/key/latest').formUrl(payload).post().json();
