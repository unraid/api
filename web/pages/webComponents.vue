<script lang="ts" setup>
import { serverState } from '~/_data/serverState';

const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  nuxtApp.$customElements.registerEntry('UnraidComponents');
});
</script>

<template>
  <client-only>
    <unraid-i18n-host class="flex flex-col gap-6 p-6 max-w-5xl mx-auto text-black bg-white dark:text-white dark:bg-black">
      <h2 class="text-xl font-semibold font-mono">
        Web Components
      </h2>
      <h3 class="text-lg font-semibold font-mono">
        UserProfileCe
      </h3>
      <unraid-user-profile :server="JSON.stringify(serverState)" />
      <hr class="border-black">
      <h3 class="text-lg font-semibold font-mono">
        DownloadApiLogsCe
      </h3>
      <unraid-download-api-logs />
      <hr class="border-black">
      <h3 class="text-lg font-semibold font-mono">
        AuthCe
      </h3>
      <unraid-auth />
      <hr class="border-black">
      <h3 class="text-lg font-semibold font-mono">
        KeyActionsCe
      </h3>
      <unraid-key-actions />
      <hr class="border-black">
      <h3 class="text-lg font-semibold font-mono">
        WanIpCheckCe
      </h3>
      <unraid-wan-ip-check php-wan-ip="47.184.85.45" />
      <hr class="border-black">
      <h3 class="text-lg font-semibold font-mono">
        ModalsCe
      </h3>
      <unraid-modals />
    </unraid-i18n-host>
  </client-only>
</template>
