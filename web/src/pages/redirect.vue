<script setup lang="ts">
import { onMounted } from 'vue';

const parseRedirectTarget = (target: string | null) => {
  if (target && target !== '/') {
    // parse target and ensure it is a bare path with no query parameters
    return '/';
  }
  return '/';
};

const getRedirectUrl = () => {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));

  const targetRoute = parseRedirectTarget(search.get('target'));
  const dataParam = search.get('data') ?? hash.get('data');

  const baseUrl = `${window.location.origin}${targetRoute}`;

  if (dataParam) {
    if (!search.has('data') && hash.has('data')) {
      return `${baseUrl}#data=${encodeURIComponent(dataParam)}`;
    }

    return `${baseUrl}?data=${encodeURIComponent(dataParam)}`;
  }

  return baseUrl;
};

onMounted(() => {
  setTimeout(() => {
    const textElement = document.getElementById('text');
    if (textElement) {
      textElement.style.display = 'block';
    }
  }, 750);

  const redirectUrl = getRedirectUrl();
  console.log('[redirect.vue] redirecting to:', redirectUrl);
  window.location.href = redirectUrl;
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
