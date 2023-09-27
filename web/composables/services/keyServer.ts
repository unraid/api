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
  purchaseable: true,
  registered: false,
  replaceable: false,
  upgradeable: false,
  upgradeAllowed: 'pro' | 'plus' | 'unleashed'[],
}
export interface ValidateGuidPayload {
  guid: string;
  keyfile?: string;
}
export const validateGuid = (payload: ValidateGuidPayload) => KeyServer
  .url('/validate/guid')
  .formUrl(payload)
  .post();
