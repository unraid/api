import wretch from 'wretch';
import formData from 'wretch/addons/formData';
import formUrl from 'wretch/addons/formUrl';
import queryString from 'wretch/addons/queryString';

import { useErrorsStore } from '~/store/errors';

const errorsStore = useErrorsStore();

export const request = wretch()
  .addon(formData)
  .addon(formUrl)
  .addon(queryString)
  .errorType('json')
  .resolve((response) => {
    return (
      response
        .error('Error', (error) => {
          errorsStore.setError(error);
        })
        .error('TypeError', (error) => {
          errorsStore.setError(error);
        })
    );
  });
