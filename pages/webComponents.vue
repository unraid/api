<script lang="ts" setup>
import { serverState } from '~/_data/serverState';

const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  nuxtApp.$customElements.registerEntry('UnraidComponents');
});
</script>

<template>
  <client-only>
    <div class="text-black bg-white dark:text-white dark:bg-black">
      <div class="max-w-5xl mx-auto">
        <div class="flex flex-col gap-6 p-6">
          <h2 class="text-xl font-semibold font-mono">
            Web Components
          </h2>
          <h3 class="text-lg font-semibold font-mono">
            UserProfileCe
          </h3>
          <unraid-i18n-host>
            <unraid-user-profile :server="JSON.stringify(serverState)" />
          </unraid-i18n-host>
          <hr class="border-black">
          <h3 class="text-lg font-semibold font-mono">
            DownloadApiLogsCe
          </h3>
          <unraid-i18n-host>
            <unraid-download-api-logs />
          </unraid-i18n-host>
          <hr class="border-black">
          <h3 class="text-lg font-semibold font-mono">
            AuthCe
          </h3>
          <unraid-i18n-host>
            <unraid-auth />
          </unraid-i18n-host>
          <hr class="border-black">
          <h3 class="text-lg font-semibold font-mono">
            KeyActionsCe
          </h3>
          <unraid-i18n-host>
            <unraid-key-actions />
          </unraid-i18n-host>
          <hr class="border-black">
          <h3 class="text-lg font-semibold font-mono">
            WanIpCheckCe
          </h3>
          <unraid-i18n-host>
            <unraid-wan-ip-check php-wan-ip="47.184.85.45" />
          </unraid-i18n-host>
          <hr class="border-black">
          <h3 class="text-lg font-semibold font-mono">
            ModalsCe
          </h3>
          <unraid-i18n-host>
            <unraid-modals />
          </unraid-i18n-host>
        </div>
      </div>
    </div>
  </client-only>
</template>
