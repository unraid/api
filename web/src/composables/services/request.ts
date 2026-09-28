import wretch from 'wretch';
import formData from 'wretch/addons/formData';
import formUrl from 'wretch/addons/formUrl';
import queryString from 'wretch/addons/queryString';

import { useErrorsStore } from '~/store/errors';

/**
 * The webGUI CSRF gate (local_prepend.php) validates same-origin POSTs against
 * `$var['csrf_token']`, accepting the token via an `x-csrf-token` header for
 * XHR/fetch callers. jQuery callers get this for free via `$.ajaxPrefilter`, and
 * the Apollo client already sets the header itself — attach it here so every
 * fetch-based webGUI request is covered too, rather than each caller having to
 * remember to pass the token. Restricted to same-origin requests so the token is
 * never sent to external hosts.
 */
const isSameOriginRequest = (url: string): boolean => {
  try {
    return new URL(url, globalThis.location?.href).origin === globalThis.location?.origin;
  } catch {
    return true;
  }
};

export const request = wretch()
  .addon(formData)
  .addon(formUrl)
  .addon(queryString)
  .errorType('json')
  .defer((w, url) => {
    const token = globalThis.csrf_token;
    return token && isSameOriginRequest(url) ? w.headers({ 'x-csrf-token': token }) : w;
  })
  .resolve((response) => {
    return response
      .error('Error', (error) => {
        const errorsStore = useErrorsStore();
        errorsStore.setError({
          heading: `WretchError ${error.status}`,
          message: `${error.text} • ${error.url}`,
          level: 'error',
          ref: 'wretchError',
          type: 'request',
        });
      })
      .error('TypeError', (error) => {
        const errorsStore = useErrorsStore();
        errorsStore.setError({
          heading: `WretchTypeError ${error.status}`,
          message: `${error.text} • ${error.url}`,
          level: 'error',
          ref: 'wretchTypeError',
          type: 'request',
        });
      });
  });
