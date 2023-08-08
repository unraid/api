<script lang="ts" setup>
import { serverState } from '~/_data/serverState';

const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  nuxtApp.$customElements.registerEntry('UnraidComponents');
});
</script>

<template>
  <div class="text-black bg-white dark:text-white dark:bg-black">
    <div class="max-w-5xl mx-auto">
      <client-only>
        <div class="flex flex-col gap-6 p-6">
          <h2 class="text-xl font-semibold font-mono">
            Vue Components
          </h2>
          <h3 class="text-lg font-semibold font-mono">
            UserProfileCe
          </h3>
          <UserProfileCe :server="serverState" />
          <hr class="border-black">
          <h3 class="text-lg font-semibold font-mono">
            DownloadApiLogsCe
          </h3>
          <DownloadApiLogsCe />
          <hr class="border-black">
          <h3 class="text-lg font-semibold font-mono">
            AuthCe
          </h3>
          <AuthCe />
          <hr class="border-black">
          <h3 class="text-lg font-semibold font-mono">
            KeyActionsCe
          </h3>
          <KeyActionsCe />
          <hr class="border-black">
          <h3 class="text-lg font-semibold font-mono">
            WanIpCheckCe
          </h3>
          <WanIpCheckCe php-wan-ip="47.184.85.45" />
          <hr class="border-black">
          <h3 class="text-lg font-semibold font-mono">
            ModalsCe
          </h3>
          <ModalsCe />
        </div>
      </client-only>
    </div>
  </div>
</template>
