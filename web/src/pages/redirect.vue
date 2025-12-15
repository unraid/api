<script setup lang="ts">
import { onMounted } from 'vue';

import { navigate } from '~/helpers/external-navigation';

const parseRedirectTarget = (target: string | null) => {
  if (target && target !== '/') {
    // parse target and ensure it is a bare path with no query parameters
    console.log(target);
    return '/';
  }
  return '/';
};

const getRedirectUrl = () => {
  const search = new URLSearchParams(window.location.search);
  const targetRoute = parseRedirectTarget(search.get('target'));
  if (search.has('data') && (search.size === 1 || search.size === 2)) {
    return `${window.location.origin}${targetRoute}?data=${encodeURIComponent(search.get('data')!)}`;
  }
  return `${window.location.origin}${targetRoute}`;
};

onMounted(() => {
  setTimeout(() => {
    const textElement = document.getElementById('text');
    if (textElement) {
      textElement.style.display = 'block';
    }
  }, 750);

  navigate(getRedirectUrl());
});
</script>

<template>
  <div>
    <div
      id="text"
      style="text-align: center; margin-top: calc(100vh - 75%); display: none; font-family: sans-serif"
    >
      <h1>Redirecting...</h1>
      <h2><a :href="getRedirectUrl()">Click here if you are not redirected automatically</a></h2>
    </div>
  </div>
</template>
