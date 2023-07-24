<script lang="ts" setup>
import { serverState } from '~/_data/serverState';

const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  nuxtApp.$customElements.registerEntry('ConnectComponents');
});
</script>

<template>
  <client-only>
    <div class="text-black bg-white dark:text-white dark:bg-black">
      <div class="max-w-5xl mx-auto">
        <div class="flex flex-col gap-6 p-6">
          <h2>Web Components</h2>
          <h3>UserProfileCe</h3>
          <unraid-user-profile :server="JSON.stringify(serverState)" />
          <hr>
          <h3>DownloadApiLogsCe</h3>
          <unraid-download-api-logs />
          <hr>
          <h3>AuthCe</h3>
          <unraid-auth />
          <hr>
          <h3>KeyActionsCe</h3>
          <unraid-key-actions />
          <hr>
          <h3>WanIpCheckCe</h3>
          <unraid-wan-ip-check php-wan-ip="47.184.85.45" />
          <hr>
          <h3>ModalsCe</h3>
          <unraid-modals />
        </div>
      </div>
    </div>
  </client-only>
</template>

<style lang="postcss" scoped>
h2 {
  @apply text-xl font-semibold font-mono;
}

h3 {
  @apply text-lg font-semibold font-mono;
}

hr {
  @apply border-black;
}
</style>
