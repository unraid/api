<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import { Toaster } from '@unraid/ui';
import { useDummyServerStore } from '~/_data/serverState';

import BrandLogo from '~/components/Brand/Logo.vue';
import ConnectSettingsCe from '~/components/ConnectSettings/ConnectSettings.ce.vue';
import HeaderOsVersionCe from '~/components/HeaderOsVersion.ce.vue';

const serverStore = useDummyServerStore();
const { serverState } = storeToRefs(serverStore);

// Define window type extension
declare global {
  interface Window {
    __unraidUiComponentsRegistered?: boolean;
  }
}

// Debug: Log immediately when component is created
console.log('[WebComponents Test] Component setup executing');

// Check if components are loaded after mount
onMounted(async () => {
  console.log('[WebComponents Test] onMounted hook called');

  // Check if components have already been registered
  if (window.__unraidUiComponentsRegistered) {
    console.log('[WebComponents Test] Components already registered');
    return;
  }

  try {
    // For development, we need to manually import and run the setup
    if (import.meta.dev) {
      console.log('[WebComponents Test] Loading web components in dev mode...');

      // Dynamically import the entry file and execute it
      await import('#customElementsEntries/unraid-components.client.js');

      console.log('[WebComponents Test] Web components imported successfully');
      window.__unraidUiComponentsRegistered = true;
    } else {
      // In production, create script tag for built bundle
      const script = document.createElement('script');
      script.type = 'module';
      script.src = '/_nuxt/unraid-components.client.js';

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load production script'));
        document.head.appendChild(script);
      });

      window.__unraidUiComponentsRegistered = true;
    }

    // Give components time to register
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if components are registered
    console.log('[WebComponents Test] Checking for registered components...');
    console.log('unraid-auth defined?', customElements.get('unraid-auth') !== undefined);
    console.log('unraid-user-profile defined?', customElements.get('unraid-user-profile') !== undefined);
    console.log('unraid-detail-test defined?', customElements.get('unraid-detail-test') !== undefined);
  } catch (error) {
    console.error('[WebComponents Test] Failed to load web components:', error);
    window.__unraidUiComponentsRegistered = false;
  }
});
</script>

<template>
  <client-only>
    <div class="flex flex-col gap-6 p-6 mx-auto text-black bg-white dark:text-white dark:bg-black">
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
      <hr class="border-black dark:border-white" >

      <h3 class="text-lg font-semibold font-mono">ConnectSettingsCe</h3>
      <ConnectSettingsCe />
      <hr class="border-black dark:border-white" >
      <h3 class="text-lg font-semibold font-mono">DownloadApiLogsCe</h3>
      <unraid-download-api-logs />
      <hr class="border-black dark:border-white" >
      <h3 class="text-lg font-semibold font-mono">AuthCe</h3>
      <unraid-auth />
      <hr class="border-black dark:border-white" >
      <h3 class="text-lg font-semibold font-mono">WanIpCheckCe</h3>
      <unraid-wan-ip-check php-wan-ip="47.184.85.45" />
      <hr class="border-black dark:border-white" >
      <h3 class="text-lg font-semibold font-mono">HeaderOsVersion</h3>
      <unraid-header-os-version />
      <hr class="border-black dark:border-white" >
      <h3 class="text-lg font-semibold font-mono">UpdateOsCe</h3>
      <unraid-update-os />
      <hr class="border-black dark:border-white" >
      <h3 class="text-lg font-semibold font-mono">DowngradeOsCe</h3>
      <unraid-downgrade-os restore-release-date="2022-10-10" restore-version="6.11.2" />
      <hr class="border-black dark:border-white" >
      <h3 class="text-lg font-semibold font-mono">RegistrationCe</h3>
      <unraid-registration />
      <hr class="border-black dark:border-white" >
      <h3 class="text-lg font-semibold font-mono">ModalsCe</h3>
      <!-- uncomment to test modals <unraid-modals />-->
      <hr class="border-black dark:border-white" >
      <h3 class="text-lg font-semibold font-mono">SSOSignInButtonCe</h3>
      <unraid-sso-button />
      <hr class="border-black dark:border-white" >
      <h3 class="text-lg font-semibold font-mono">ApiKeyManagerCe</h3>
      <unraid-api-key-manager />

      <unraid-detail-test />
    </div>
    <Toaster rich-colors close-button />
  </client-only>
</template>
