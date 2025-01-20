<script setup lang="ts">
import Button from '~/components/Brand/Button.vue';
import { ACCOUNT } from '~/helpers/urls';
import { useServerStore } from '~/store/server';
import type { Server } from '~/types/server';

export interface Props {
  server?: Server | string;
}
const props = defineProps<Props>();
const serverStore = useServerStore();

const { ssoSubIds } = storeToRefs(serverStore);

onBeforeMount(() => {
  if (!props.server) {
    throw new Error('Server data not present');
  }
  console.log('props.server', props.server);

  if (typeof props.server === 'object') {
    // Handles the testing dev Vue component
    serverStore.setServer(props.server);
  } else if (typeof props.server === 'string') {
    // Handle web component
    const parsedServerProp = JSON.parse(props.server);
    serverStore.setServer(parsedServerProp);
  }
});

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
  const url = new URL('sso', ACCOUNT);
  url.searchParams.append('uids', ssoSubIds.value);
  url.searchParams.append('callbackUrl', window.location.href);
  return url.toString();
});
</script>

<template>
  <template v-if="ssoSubIds">
    <Button target="_blank" :href="externalSSOUrl">Sign In With Unraid.net Account</Button>
  </template>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
