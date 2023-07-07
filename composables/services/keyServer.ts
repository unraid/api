import { request } from '~/composables/services/request';

const KeyServer = request.url('https://keys.lime-technology.com');

export interface StartTrialPayload {
  guid: string;
  timestamp: number; // timestamp in seconds
}
export interface StartTrialResponse {
  license?: string; 
  trial?: string
};
export const startTrial = (payload: StartTrialPayload) => KeyServer
  .url('/account/trial')
  .formUrl(payload)
  .post();

export interface KeyServerTroubleshootPayload {
  email: string;
  subject: string;
  message: string;
  guid?: string; // if passed it'll be appended to the email subject instead of date/time
  comments?: string; // HONEYPOT FIELD. Passing a non-empty value for 'comments' will trigger the honeypot, thus not send an email but won't return any errors.
}
export const troubleshoot = (payload: KeyServerTroubleshootPayload) => KeyServer
  .url('/ips/troubleshoot')
  .formUrl(payload)
  .post();

export const validateGuid = (payload: { guid: string }) => KeyServer
  .url('/validate/guid')
  .formUrl(payload)
  .post();
