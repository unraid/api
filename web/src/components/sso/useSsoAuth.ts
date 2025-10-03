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

  const getStateToken = (): string | null => {
    const state = sessionStorage.getItem('sso_state');
    return state ?? null;
  };

  const generateStateToken = (): string => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const state = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('sso_state', state);
    return state;
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
    // Generate state token for CSRF protection
    const state = generateStateToken();

    // Store provider ID separately since state must be alphanumeric only
    sessionStorage.setItem('sso_state', state);
    sessionStorage.setItem('sso_provider', providerId);

    // Build the redirect URI based on current window location
    const redirectUri = `${window.location.protocol}//${window.location.host}/graphql/api/auth/oidc/callback`;

    // Redirect to OIDC authorization endpoint with state token and redirect URI
    const authUrl = `/graphql/api/auth/oidc/authorize/${encodeURIComponent(providerId)}?state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  };

  const handleOAuthCallback = async () => {
    try {
      // First check hash parameters (for token and error - keeps them out of server logs)
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const hashToken = hashParams.get('token');
      const hashError = hashParams.get('error');

      // Then check query parameters (for OAuth code/state from provider redirects)
      const search = new URLSearchParams(window.location.search);
      const code = search.get('code') ?? '';
      const state = search.get('state') ?? '';
      const sessionState = getStateToken();

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

      // Handle Unraid.net SSO callback (comes to /login with code and state)
      if (code && state && window.location.pathname === '/login') {
        currentState.value = 'loading';

        // Redirect to our OIDC callback endpoint to exchange the code
        const callbackUrl = `/graphql/api/auth/oidc/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        window.location.href = callbackUrl;
        return;
      }

      // Error if we have mismatched state
      if (code && state && state !== sessionState) {
        currentState.value = 'error';
        error.value = t('sso.useSsoAuth.invalidCallbackParameters');
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
