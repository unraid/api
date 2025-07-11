<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { SSO_ENABLED } from '~/store/account.fragment';

import { BrandButton } from '@unraid/ui';
import { ACCOUNT } from '~/helpers/urls';

type CurrentState = 'loading' | 'idle' | 'error';

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
    const sessionState = getStateToken();

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
    error.value = 'Error fetching token';
    reEnableFormOnError();
  }
});

const buttonText = computed<string>(() => {
  switch (currentState.value) {
    case 'loading':
      return 'Signing you in...';
    case 'error':
      return 'Error';
    default:
      return 'Log In With Unraid.net';
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
        <p v-if="currentState === 'idle' || currentState === 'error'" class="text-center">or</p>
        <p v-if="currentState === 'error'" class="text-red-500 text-center">{{ error }}</p>
        <BrandButton
          :disabled="currentState === 'loading'"
          variant="outline"
          class="rounded-none uppercase tracking-widest"
          @click="navigateToExternalSSOUrl"
          >{{ buttonText }}</BrandButton
        >
      </div>
    </template>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
