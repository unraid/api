import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export type AuthState = 'loading' | 'idle' | 'error';

export function useSsoAuth() {
  const { t } = useI18n();
  const currentState = ref<AuthState>('idle');
  const error = ref<string | null>(null);

  const getInputFields = (): {
    form: HTMLFormElement;
    passwordField: HTMLInputElement;
    usernameField: HTMLInputElement;
  } => {
    const form = document.querySelector('form[action="/login"]') as HTMLFormElement;
    const passwordField = document.querySelector('input[name=password]') as HTMLInputElement;
    const usernameField = document.querySelector('input[name=username]') as HTMLInputElement;
    if (!form || !passwordField || !usernameField) {
      console.warn('Could not find form, username, or password field');
    }
    return { form, passwordField, usernameField };
  };

  const enterCallbackTokenIntoField = (token: string) => {
    const { form, passwordField, usernameField } = getInputFields();
    if (!form || !passwordField || !usernameField) {
      console.warn('Could not find form, username, or password field');
      return;
    }

    usernameField.value = 'root';
    passwordField.value = token;
    // Submit the form
    form.requestSubmit();
  };

  const disableFormOnSubmit = () => {
    const fields = getInputFields();
    if (fields?.form) {
      fields.form.style.display = 'none';
    }
  };

  const reEnableFormOnError = () => {
    const fields = getInputFields();
    if (fields?.form) {
      fields.form.style.display = 'block';
    }
  };

  const navigateToProvider = (providerId: string) => {
    currentState.value = 'loading';
    error.value = null;
    window.location.href = `/auth/sso/${encodeURIComponent(providerId)}`;
  };

  const handleOAuthCallback = async () => {
    try {
      // First check hash parameters (for token and error - keeps them out of server logs)
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const hashToken = hashParams.get('token');
      const hashError = hashParams.get('error');

      // Then check query parameters (for error/token fallback)
      const search = new URLSearchParams(window.location.search);

      // Check for error in hash (preferred) or query params (fallback)
      const errorParam = hashError || search.get('error') || '';
      if (errorParam) {
        currentState.value = 'error';
        error.value = errorParam;

        // Clean up the URL (both hash and query params)
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Handle OAuth callback if we have a token in hash (from OIDC redirect)
      const token = hashToken || search.get('token'); // Check hash first, query as fallback
      if (token) {
        currentState.value = 'loading';
        disableFormOnSubmit();
        enterCallbackTokenIntoField(token);

        // Clean up the URL (both hash and query params)
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (window.location.pathname !== '/login') {
        return;
      }
    } catch (err) {
      console.error('Error fetching token', err);
      currentState.value = 'error';
      error.value = t('sso.useSsoAuth.errorFetchingToken');
      reEnableFormOnError();
    }
  };

  onMounted(() => {
    handleOAuthCallback();
  });

  return {
    currentState,
    error,
    navigateToProvider,
  };
}
