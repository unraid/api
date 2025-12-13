<script setup lang="ts">
import { onMounted } from 'vue';

const parseRedirectTarget = (target: string | null) => {
  if (target && target !== '/') {
    try {
      // Parse target and ensure it is a bare path with no query parameters.
      const url = new URL(target, window.location.origin);
      return url.pathname || '/';
    } catch (_e) {
      return '/';
    }
  }
  return '/';
};

const getRedirectUrl = () => {
  const search = new URLSearchParams(window.location.search);
  const rawHash = window.location.hash || '';
  const hashWithoutHash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  const hashData = hashWithoutHash.startsWith('data=') ? hashWithoutHash.slice('data='.length) : '';

  const targetRoute = parseRedirectTarget(search.get('target'));
  const baseUrl = `${window.location.origin}${targetRoute}`;

  // If the incoming URL already has a hash-based data payload, preserve it exactly.
  if (hashData) {
    return `${baseUrl}#data=${hashData}`;
  }

  // Fallback: accept legacy ?data= input and convert it to hash-based data.
  const queryData = search.get('data');
  if (queryData) {
    const encoded = encodeURI(queryData);
    return `${baseUrl}#data=${encoded}`;
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
