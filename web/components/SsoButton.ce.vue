<script setup lang="ts">
import Button from '~/components/Brand/Button.vue';
import { ACCOUNT } from '~/helpers/urls';

export interface Props {
  ssoSubIds?: string;
}
const props = defineProps<Props>();

const queryParams = useUrlSearchParams<{ token: string }>();

const enterCallbackTokenIntoField = (token: string) => {
  const passwordField = document.querySelector('input[name=password]') as HTMLInputElement;
  const usernameField = document.querySelector('input[name=username]') as HTMLInputElement;
  const form = document.querySelector('form[action="/login"]') as HTMLFormElement;

  if (!passwordField || !usernameField || !form) {
    console.warn('Could not find form, username, or password field');
  } else {
    usernameField.value = 'root';
    passwordField.value = 'password';
    // Submit the form
    form.requestSubmit();
  }
};

const search = new URLSearchParams(window.location.search);
const token = search.get('token') ?? '';
if (token) {
  enterCallbackTokenIntoField(token);
  // Clear the token from the URL
  window.history.replaceState({}, document.title, window.location.pathname);
  window.location.search = '';
}

watch(queryParams, (newVal) => {
  console.log('newVal', newVal);
  if (newVal?.token) {
    enterCallbackTokenIntoField(newVal.token);
    // Clear the token from the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.search = '';
  }
});

const externalSSOUrl = computed(() => {
  if (props.ssoSubIds === undefined) {
    return '';
  }
  const url = new URL('sso', ACCOUNT);
  url.searchParams.append('uids', props.ssoSubIds);
  url.searchParams.append('callbackUrl', window.location.href);
  return url.toString();
});
</script>

<template>
  <template v-if="props.ssoSubIds">
    <Button target="_blank" :href="externalSSOUrl">Sign In With Unraid.net Account</Button>
  </template>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
