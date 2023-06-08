import wretch from 'wretch';
import FormUrlAddon from 'wretch/addons/formUrl';
import QueryStringAddon from 'wretch/addons/queryString';

import { useErrorsStore } from '~/store/errors';

const errorsStore = useErrorsStore();

export const request = wretch()
  .addon(FormUrlAddon)
  .addon(QueryStringAddon)
  .errorType('json')
  .resolve((response) => {
    return (
      response
        .error("Error", (error) => {
          console.log('global catch (Error class)', error);
          errorsStore.setError(error);
        })
        .error("TypeError", (error) => {
          console.log('global type error catch (TypeError class)', error);
          errorsStore.setError(error);
        })
    );
  });
