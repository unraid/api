import { request } from '~/composables/services/request';
import { OS_RELEASES } from '~/helpers/urls';
import type { ServerUpdateOsResponse } from '~/types/server';
/**
 * @name WebguiInstallKey
 * @description used to auto install key urls
 * @type GET - data should be passed using wretch's `.query({ url: String })`
 * @param {string} url - URL of license key
 */
export const WebguiInstallKey = request.url('/webGui/include/InstallKey.php');
/**
 * @type POST
 * @dataType - `formUrl(Object)` https://github.com/elbywan/wretch#formurlinput-object--string
 * @param {string} csrf_token
 * @param {string} '#file' - ex:  getters.myServersCfgPath
 * @param {string} '#section' - ex:  'remote'
 * @param {string} apikey - from key server's response
 * @param {string} avatar
 * @param {string} regWizTime - date_guid
 * @param {string} email
 * @param {string} username
 */
export const WebguiUpdate = request.url('/update.php');
/**
 * @name WebguiUpdateDns
 * @dataForm formUrl
 * @description Used after Sign In to ensure URLs will work correctly
 * @note this request is delayed by 500ms to allow server to process key install fully
 * @todo potentially remove delay
 * @param csrf_token
 * @type POST
 */
export const WebguiUpdateDns = request.url('/webGui/include/UpdateDNS.php');
/**
 * @name WebguiState
 * @description used to get current state of server via PHP rather than unraid-api
 * @type GET
*/
export const WebguiState = request.url('/plugins/dynamix.my.servers/data/server-state.php');
/**
 * Run unraid-api command's via php requests
 */
export interface WebguiUnraidApiCommandPayload {
  csrf_token: string;
  command: 'report' | 'restart' | 'start';
  param1?: '-v'|'-vv';
}
export const WebguiUnraidApiCommand = async (payload: WebguiUnraidApiCommandPayload) => {
  console.debug('[WebguiUnraidApiCommand] payload', payload);
  if (!payload) { return console.error('[WebguiUnraidApiCommand] payload is required'); }

  try {
    return await request
      .url('/plugins/dynamix.my.servers/include/unraid-api.php')
      .formUrl(payload)
      .post()
      .json((json) => {
        return json;
      })
      .catch((error) => {
        console.error('[WebguiUnraidApiCommand] catch failed to execute unraid-api', error, payload);
        return error;
      });
  } catch (error) {
    console.error('[WebguiUnraidApiCommand] catch failed to execute unraid-api', error, payload);
    return error;
  }
};

export interface NotifyPostParameters {
  cmd: 'init' | 'smtp-init' | 'cron-init' | 'add' | 'get' | 'hide' | 'archive';
  csrf_token: string;
  e?: string; // 'add' command option
  s?: string; // 'add' command option
  d?: string; // 'add' command option
  i?: string; // 'add' command option
  m?: string; // 'add' command option
  x?: string; // 'add' command option
  t?: string; // 'add' command option
  file?: string; // 'hide' and 'archive' command option
}
export const WebguiNotify = async (payload: NotifyPostParameters) => {
  console.debug('[WebguiNotify] payload', payload);
  if (!payload) { return console.error('[WebguiNotify] payload is required'); }

  try {
    const response = await request
      .url('/webGui/include/Notify.php')
      .formData(payload)
      .post();
    return response;
  } catch (error) {
    console.error('[WebguiNotify] catch failed to execute Notify', error, payload);
    return error;
  }
};

export const WebguiCheckForUpdate = async (): Promise<ServerUpdateOsResponse | unknown> => {
  console.debug('[WebguiCheckForUpdate]');
  try {
    const response = await request
      .url('/plugins/dynamix.plugin.manager/include/UnraidCheck.php')
      .query({
        altUrl: OS_RELEASES.toString(),
        json: true,
      })
      .get()
      .json((json) => {
        return json as ServerUpdateOsResponse;
      })
      .catch((error) => {
        console.error('[WebguiCheckForUpdate] catch failed to execute UpdateCheck', error);
        throw new Error('Error checking for updates');
      });
    return response as ServerUpdateOsResponse;
  } catch (error) {
    console.error('[WebguiCheckForUpdate] catch failed to execute UpdateCheck', error);
    throw new Error('Error checking for updates');
  }
};
