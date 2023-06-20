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
 * @name WebguiUpdateDns
 * @description used after Sign In to ensure URLs will work correctly
 * @type POST
 */
export const WebguiUnraidApiCommand = request.url('/plugins/dynamix.my.servers/include/unraid-api.php');
