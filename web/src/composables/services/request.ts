import wretch from 'wretch';
import formData from 'wretch/addons/formData';
import formUrl from 'wretch/addons/formUrl';
import queryString from 'wretch/addons/queryString';

import { useErrorsStore } from '~/store/errors';

export const request = wretch()
  .addon(formData)
  .addon(formUrl)
  .addon(queryString)
  .errorType('json')
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
