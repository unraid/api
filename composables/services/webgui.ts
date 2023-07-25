import { request } from '~/composables/services/request';
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
  command: 'report' | 'start';
  param1?: '-v'|'-vv';
}
export const WebguiUnraidApiCommand = async (payload: WebguiUnraidApiCommandPayload) => {
  console.debug('[WebguiUnraidApiCommand]', payload);
  // eslint-disable-next-line camelcase
  const { csrf_token, command, param1 } = payload;
  try {
    return await request
      .url('/plugins/dynamix.my.servers/include/unraid-api.php')
      .formUrl({
        // eslint-disable-next-line camelcase
        csrf_token,
        command,
        param1,
      })
      .post()
      .json((json) => {
        console.debug('👼 [WebguiUnraidApiCommand]', json);
        return json;
      })
      .catch((error) => {
        console.error(`[WebguiUnraidApiCommand] catch failed to execute unraid-api ${command} 😢`, error);
      });
  } catch (error) {
    console.error(`[WebguiUnraidApiCommand] catch failed to execute unraid-api ${command} 😢`, error);
  }
};
