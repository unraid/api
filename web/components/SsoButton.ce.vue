<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useI18n } from 'vue-i18n';
import { SSO_ENABLED } from '~/store/account.fragment';

import { BrandButton } from '@unraid/ui';
import { ACCOUNT } from '~/helpers/urls';

type CurrentState = 'loading' | 'idle' | 'error';

const { t } = useI18n();
const currentState = ref<CurrentState>('idle');
const error = ref<string | null>(null);

const { result } = useQuery(SSO_ENABLED);

const isSsoEnabled = computed<boolean>(
  () => result.value?.isSSOEnabled ?? false
);

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
  if (!passwordField || !usernameField || !form) {
    console.warn('Could not find form, username, or password field');
  } else {
    usernameField.value = 'root';
    passwordField.value = token;
    // Submit the form
    form.requestSubmit();
  }
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
  const { form } = getInputFields();
  if (form) {
    form.style.display = 'none';
  }
};

const reEnableFormOnError = () => {
  const { form } = getInputFields();
  if (form) {
    form.style.display = 'block';
  }
};

onMounted(async () => {
  try {
    const search = new URLSearchParams(window.location.search);
    const code = search.get('code') ?? '';
    const state = search.get('state') ?? '';
    const ssoError = search.get('sso_error') ?? '';
    const sessionState = getStateToken();

    // Check for SSO error parameter
    if (ssoError) {
      currentState.value = 'error';
      // Map common SSO errors to user-friendly messages with translation support
      const errorMap: Record<string, string> = {
        'invalid_credentials': t('Invalid Unraid.net credentials'),
        'user_not_authorized': t('This Unraid.net account is not authorized to access this server'),
        'sso_disabled': t('SSO login is not enabled on this server'),
        'token_expired': t('Login session expired. Please try again'),
        'network_error': t('Network error. Please check your connection'),
      };
      error.value = errorMap[ssoError] || t('SSO login failed. Please try again');
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('sso_error');
      window.history.replaceState({}, document.title, url.pathname + url.search);
      return;
    }

    if (code && state === sessionState) {
      disableFormOnSubmit();
      currentState.value = 'loading';
      const token = await fetch(new URL('/api/oauth2/token', ACCOUNT), {
        method: 'POST',
        body: new URLSearchParams({
          code,
          client_id: 'CONNECT_SERVER_SSO',
          grant_type: 'authorization_code',
        }),
      });
      if (token.ok) {
        const tokenBody = await token.json();
        if (!tokenBody.access_token) {
          throw new Error('Token body did not contain access_token');
        }
        enterCallbackTokenIntoField(tokenBody.access_token);
        if (window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        throw new Error('Failed to fetch token');
      }
    }
  } catch (err) {
    console.error('Error fetching token', err);

    currentState.value = 'error';
    error.value = t('Error fetching token');
    reEnableFormOnError();
  }
});

const buttonText = computed<string>(() => {
  switch (currentState.value) {
    case 'loading':
      return t('Logging in...');
    case 'error':
      return t('Try Again');
    default:
      return t('Log In With Unraid.net');
  }
});

const navigateToExternalSSOUrl = () => {
  const url = new URL('sso', ACCOUNT);
  const callbackUrlLogin = new URL('login', window.location.origin);
  const state = generateStateToken();

  url.searchParams.append('callbackUrl', callbackUrlLogin.toString());
  url.searchParams.append('state', state);

  window.location.href = url.toString();
};
</script>

<template>
  <div>
    <template v-if="isSsoEnabled">
      <div class="w-full flex flex-col gap-1 my-1">
        <p v-if="currentState === 'idle' || currentState === 'error'" class="text-center">{{ t('or') }}</p>
        <p v-if="currentState === 'error'" class="text-red-500 text-center">{{ error }}</p>
        <BrandButton
          :disabled="currentState === 'loading'"
          variant="outline-primary"
          class="sso-button"
          @click="navigateToExternalSSOUrl"
          >{{ buttonText }}</BrandButton
        >
      </div>
    </template>
  </div>
</template>

<style>
/* Font size overrides for 16px base (standard Tailwind sizing) */
:host {
  /* Text sizes - standard Tailwind rem values */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */
  --text-5xl: 3rem; /* 48px */
  --text-6xl: 3.75rem; /* 60px */
  --text-7xl: 4.5rem; /* 72px */
  --text-8xl: 6rem; /* 96px */
  --text-9xl: 8rem; /* 128px */
  
  /* Spacing - standard Tailwind value */
  --spacing: 0.25rem; /* 4px */
}

.sso-button {
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  line-height: 1 !important;
  text-transform: uppercase !important;
  letter-spacing: 2px !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 0.125rem !important;
}
</style>
