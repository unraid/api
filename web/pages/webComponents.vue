<script lang="ts" setup>
import { onBeforeMount } from 'vue';
import { storeToRefs } from 'pinia';
import { useCustomElements } from '#imports';
import { useDummyServerStore } from '~/_data/serverState';
import { Toaster } from '@unraid/ui';

const serverStore = useDummyServerStore();
const { serverState } = storeToRefs(serverStore);
const { registerEntry } = useCustomElements();
onBeforeMount(() => {
  registerEntry('UnraidComponents');
});
</script>

<template>
  <client-only>
    <div
      class="flex flex-col gap-6 p-6 mx-auto text-black bg-white dark:text-white dark:bg-black"
    >
      <h2 class="text-xl font-semibold font-mono">Web Components</h2>
      <h3 class="text-lg font-semibold font-mono">UserProfileCe</h3>
      <header class="bg-header-background-color py-4 flex flex-row justify-between items-center">
        <div class="inline-flex flex-col gap-4 items-start px-4">
          <a href="https://unraid.net" target="_blank">
            <BrandLogo class="w-[100px] sm:w-[150px]" />
          </a>
          <HeaderOsVersionCe />
        </div>
        <unraid-user-profile :server="JSON.stringify(serverState)" />
      </header>
      <hr class="border-black dark:border-white" />

      <h3 class="text-lg font-semibold font-mono">ConnectSettingsCe</h3>
      <ConnectSettingsCe />
      <hr class="border-black dark:border-white" />
      <h3 class="text-lg font-semibold font-mono">DownloadApiLogsCe</h3>
      <unraid-download-api-logs />
      <hr class="border-black dark:border-white" />
      <h3 class="text-lg font-semibold font-mono">AuthCe</h3>
      <unraid-auth />
      <hr class="border-black dark:border-white" />
      <h3 class="text-lg font-semibold font-mono">WanIpCheckCe</h3>
      <unraid-wan-ip-check php-wan-ip="47.184.85.45" />
      <hr class="border-black dark:border-white" />
      <h3 class="text-lg font-semibold font-mono">HeaderOsVersion</h3>
      <unraid-header-os-version />
      <hr class="border-black dark:border-white" />
      <h3 class="text-lg font-semibold font-mono">UpdateOsCe</h3>
      <unraid-update-os />
      <hr class="border-black dark:border-white" />
      <h3 class="text-lg font-semibold font-mono">DowngradeOsCe</h3>
      <unraid-downgrade-os restore-release-date="2022-10-10" restore-version="6.11.2" />
      <hr class="border-black dark:border-white" />
      <h3 class="text-lg font-semibold font-mono">RegistrationCe</h3>
      <unraid-registration />
      <hr class="border-black dark:border-white" />
      <h3 class="text-lg font-semibold font-mono">ModalsCe</h3>
      <!-- uncomment to test modals <unraid-modals />-->
      <hr class="border-black dark:border-white" />
      <h3 class="text-lg font-semibold font-mono">SSOSignInButtonCe</h3>
      <unraid-sso-button />
      <hr class="border-black dark:border-white" />
      <h3 class="text-lg font-semibold font-mono">ApiKeyManagerCe</h3>
      <unraid-api-key-manager />
    </div>
    <Toaster rich-colors close-button />
  </client-only>
</template>
