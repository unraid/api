<script setup lang="ts">
import Button from '~/components/Brand/Button.vue';
import { ACCOUNT } from '~/helpers/urls';

export interface Props {
  ssoenabled?: boolean | string;
  ssoEnabled?: boolean;
}
const props = defineProps<Props>();

const isSsoEnabled = computed<boolean>(
  () => props['ssoenabled'] === true || props['ssoenabled'] === 'true' || props.ssoEnabled
);

const enterCallbackTokenIntoField = (token: string) => {
  const passwordField = document.querySelector('input[name=password]') as HTMLInputElement;
  const usernameField = document.querySelector('input[name=username]') as HTMLInputElement;
  const form = document.querySelector('form[action="/login"]') as HTMLFormElement;

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
  const state =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('sso_state', state);
  return state;
};

onMounted(async () => {
  try {
    const search = new URLSearchParams(window.location.search);
    const code = search.get('code') ?? '';
    const state = search.get('state') ?? '';
    const sessionState = getStateToken();

    if (code && state === sessionState) {
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
        enterCallbackTokenIntoField(tokenBody.access_token);
        if (window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.search = '';
        }
      }
    }
  } catch (err) {
    console.error('Error fetching token', err);
  } finally {
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
  <template v-if="isSsoEnabled">
    <hr class="my-4" />
    <p class="text-center my-4">Or</p>
    <Button btnStyle="outline" style="border-radius: 0;" @click="navigateToExternalSSOUrl" >Sign In With Unraid.net Account</Button>
  </template>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
