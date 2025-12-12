<script setup lang="ts">
import { onMounted } from 'vue';

const parseRedirectTarget = (target: string | null) => {
  if (target && target !== '/') {
    // parse target and ensure it is a bare path with no query parameters
    console.log('[redirect.vue] parseRedirectTarget raw target:', target);
    return '/';
  }
  return '/';
};

const getRedirectUrl = () => {
  console.log('[redirect.vue] initial window.location:', window.location.toString());

  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));

  console.log('[redirect.vue] search params:', Array.from(search.entries()));
  console.log('[redirect.vue] raw hash:', window.location.hash);
  console.log('[redirect.vue] hash params:', Array.from(hash.entries()));

  const targetRoute = parseRedirectTarget(search.get('target'));
  const dataParam = search.get('data') ?? hash.get('data');

  const baseUrl = `${window.location.origin}${targetRoute}`;

  console.log('[redirect.vue] computed values:', {
    targetRoute,
    dataParam,
    baseUrl,
    searchSize: search.size,
  });

  if (dataParam) {
    if (!search.has('data') && hash.has('data')) {
      const hashUrl = `${baseUrl}#data=${encodeURIComponent(dataParam)}`;
      console.log('[redirect.vue] redirecting with hash data:', hashUrl);
      return hashUrl;
    }

    const queryUrl = `${baseUrl}?data=${encodeURIComponent(dataParam)}`;
    console.log('[redirect.vue] redirecting with query data:', queryUrl);
    return queryUrl;
  }

  console.log('[redirect.vue] redirecting without data param:', baseUrl);
  return baseUrl;
};

onMounted(() => {
  console.log('[redirect.vue] mounted, starting redirect flow');

  setTimeout(() => {
    const textElement = document.getElementById('text');
    if (textElement) {
      textElement.style.display = 'block';
    }
  }, 750);

  const redirectUrl = getRedirectUrl();
  console.log('[redirect.vue] final redirect URL:', redirectUrl);
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
