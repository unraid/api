<script setup lang="ts">
import Button from '~/components/Brand/Button.vue';
import { ACCOUNT } from '~/helpers/urls';

export interface Props {
  subids?: string;
}
const props = defineProps<Props>();

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

onMounted(() => {
  const search = new URLSearchParams(window.location.search);
  const token = search.get('token') ?? '';
  const state = search.get('state') ?? '';
  const sessionState = getStateToken();
  if (token && state === sessionState) {
    enterCallbackTokenIntoField(token);
    // Clear the token from the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.search = '';
  }
});

const externalSSOUrl = computed<string>(() => {
  if (props.subids === undefined) {
    return '';
  }
  const url = new URL('sso', ACCOUNT);
  url.searchParams.append('uids', props.subids);
  const callbackUrlLogin = new URL('login', window.location.origin);
  const state = generateStateToken();
  callbackUrlLogin.searchParams.append('state', state);

  url.searchParams.append('callbackUrl', callbackUrlLogin.toString());
  return url.toString();
});
</script>

<template>
  <template v-if="props.subids">
    <Button target="_blank" :href="externalSSOUrl">Sign In With Unraid.net Account</Button>
  </template>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
