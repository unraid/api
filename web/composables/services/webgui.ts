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

interface WebguiUnraidCheckPayload {
  action: 'check' | 'removeAllIgnored' | 'removeIgnoredVersion' | 'ignoreVersion';
  altUrl?: string;
  json?: boolean;
  version?: string;
}

interface WebguiUnraidCheckExecPayload {
  altUrl?: string;
  json?: boolean;
}

interface WebguiUnraidCheckIgnoreResponse {
  updateOsIgnoredReleases: string[];
}

export const WebguiCheckForUpdate = async (): Promise<ServerUpdateOsResponse | unknown> => {
  console.debug('[WebguiCheckForUpdate]');
  try {
    const params: WebguiUnraidCheckExecPayload = {
      json: true,
    };
    // conditionally add altUrl if OS_RELEASES.toString() is not 'https://releases.unraid.net/os'
    if (OS_RELEASES.toString() !== 'https://releases.unraid.net/os') {
      params.altUrl = OS_RELEASES.toString();
    }
    const response = await request
      .url('/plugins/dynamix.plugin.manager/include/UnraidCheckExec.php') // @todo replace with /scripts/unraidcheck
      .query(params)
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

export const WebguiUpdateIgnore = async (payload: WebguiUnraidCheckPayload): Promise<WebguiUnraidCheckIgnoreResponse> => {
  console.debug('[WebguiUpdateIgnore] payload', payload);
  try {
    const response = await request
      .url('/plugins/dynamix.plugin.manager/include/UnraidCheck.php')
      .query(payload)
      .get()
      .json((json) => {
        console.debug('[WebguiUpdateIgnore] response', json);
        return json;
      })
      .catch((error) => {
        console.error('[WebguiUpdateIgnore] catch failed to execute UpdateIgnore', error);
        throw new Error('Error ignoring update');
      });
    return response;
  } catch (error) {
    console.error('[WebguiUpdateIgnore] catch failed to execute UpdateIgnore', error);
    throw new Error('Error ignoring update');
  }
};

export interface WebguiUpdateCancelResponse {
  message?: string;
  success?: boolean;
}
export const WebguiUpdateCancel = async (): Promise<WebguiUpdateCancelResponse> => {
  console.debug('[WebguiUpdateCancel]');
  try {
    const response = await request
      .url('/plugins/dynamix.plugin.manager/include/UnraidUpdateCancel.php')
      .get()
      .json(json => json as WebguiUpdateCancelResponse)
      .catch((error) => {
        console.error('[WebguiUpdateCancel] catch failed to execute UpdateUpdateCancel', error);
        throw new Error('Error attempting to revert OS files to cancel update');
      });
    return response as WebguiUpdateCancelResponse;
  } catch (error) {
    console.error('[WebguiUpdateCancel] catch failed to execute UpdateUpdateCancel', error);
    throw new Error('Error attempting to revert OS files to cancel update');
  }
};
