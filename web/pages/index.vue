<script lang="ts" setup>
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { BrandButton, Toaster } from '@unraid/ui';
import { useDummyServerStore } from '~/_data/serverState';
import AES from 'crypto-js/aes';

import type { SendPayloads } from '@unraid/shared-callbacks';

import LogViewerCe from '~/components/Logs/LogViewer.ce.vue';
import SsoButtonCe from '~/components/SsoButton.ce.vue';
import { useThemeStore } from '~/store/theme';

const serverStore = useDummyServerStore();
const { serverState } = storeToRefs(serverStore);
const { registerEntry } = useCustomElements();
const { theme } = storeToRefs(useThemeStore());
onBeforeMount(() => {
  registerEntry('UnraidComponents');
});

useHead({
  meta: [{ name: 'viewport', content: 'width=1300' }],
});

onMounted(() => {
  document.cookie = 'unraid_session_cookie=mockusersession';
});

const valueToMakeCallback = ref<SendPayloads | undefined>();
const callbackDestination = ref<string>('');

const createCallbackUrl = (payload: SendPayloads, sendType: string) => {
  // params differs from callbackActions.send
  console.debug('[callback.send]');

  valueToMakeCallback.value = payload; // differs from callbackActions.send

  const stringifiedData = JSON.stringify({
    actions: [...payload],
    sender: window.location.href,
    type: sendType,
  });
  const encryptedMessage = AES.encrypt(stringifiedData, import.meta.env.VITE_CALLBACK_KEY).toString();
  // build and go to url
  const destinationUrl = new URL(window.location.href); // differs from callbackActions.send
  destinationUrl.searchParams.set('data', encodeURI(encryptedMessage));

  callbackDestination.value = destinationUrl.toString(); // differs from callbackActions.send
};

const variants = [
  'fill',
  'black',
  'gray',
  'outline',
  'outline-black',
  'outline-white',
  'underline',
  'underline-hover-red',
  'white',
  'none',
] as const;

onMounted(() => {
  createCallbackUrl(
    [
      {
        // keyUrl: 'https://keys.lime-technology.com/unraid/d26a033e3097c65ab0b4f742a7c02ce808c6e963/Starter.key', // assigned to guid 1111-1111-5GDB-123412341234, use to test EGUID after key install
        keyUrl:
          'https://keys.lime-technology.com/unraid/7f7c2ddff1c38f21ed174f5c5d9f97b7b4577344/Starter.key',
        type: 'renew',
      },
      {
        sha256: 'a7d1a42fc661f55ee45d36bbc49aac71aef045cc1d287b1e7f16be0ba485c9b6',
        type: 'updateOs',
      },
    ],
    'forUpc'
  );
});

const bannerImage = ref<string>('none');

watch(
  theme,
  (newTheme) => {
    if (newTheme.banner) {
      bannerImage.value = `url(https://picsum.photos/1920/200?${Math.round(Math.random() * 100)})`;
    } else {
      bannerImage.value = 'none';
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="text-black bg-white dark:text-white dark:bg-black">
    <div class="pb-12 mx-auto">
      <client-only>
        <div class="flex flex-col gap-6 p-6">
          <DummyServerSwitcher />
          <ColorSwitcherCe />
          <h2 class="text-xl font-semibold font-mono">Vue Components</h2>
          <h3 class="text-lg font-semibold font-mono">UserProfileCe</h3>
          <header
            class="bg-header-background-color flex justify-between items-center"
            :style="{
              backgroundImage: bannerImage,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }"
          >
            <div class="inline-flex flex-col gap-4 items-start">
              <HeaderOsVersionCe />
            </div>
            <UserProfileCe :server="serverState" />
          </header>
          <!-- <hr class="border-black dark:border-white"> -->

          <h3 class="text-lg font-semibold font-mono">ConnectSettingsCe</h3>
          <ConnectSettingsCe />
          <hr class="border-black dark:border-white" />

          <!-- <h3 class="text-lg font-semibold font-mono">
            DownloadApiLogsCe
          </h3>
          <DownloadApiLogsCe />
          <hr class="border-black dark:border-white"> -->
          <!-- <h3 class="text-lg font-semibold font-mono">
            AuthCe
          </h3>
          <AuthCe />
          <hr class="border-black dark:border-white"> -->
          <!-- <h3 class="text-lg font-semibold font-mono">
            WanIpCheckCe
          </h3>
          <WanIpCheckCe php-wan-ip="47.184.85.45" />
          <hr class="border-black dark:border-white"> -->
          <h3 class="text-lg font-semibold font-mono">UpdateOsCe</h3>
          <UpdateOsCe />
          <hr class="border-black dark:border-white" />
          <h3 class="text-lg font-semibold font-mono">DowngraadeOsCe</h3>
          <DowngradeOsCe :restore-release-date="'2022-10-10'" :restore-version="'6.11.2'" />
          <hr class="border-black dark:border-white" />
          <h3 class="text-lg font-semibold font-mono">RegistrationCe</h3>
          <RegistrationCe />
          <hr class="border-black dark:border-white" />
          <h3 class="text-lg font-semibold font-mono">ModalsCe</h3>
          <ModalsCe />
          <hr class="border-black dark:border-white" />
          <h3 class="text-lg font-semibold font-mono">WelcomeModalCe</h3>
          <hr class="border-black dark:border-white" />
          <h3 class="text-lg font-semibold font-mono">Test Callback Builder</h3>
          <div class="flex flex-col justify-end gap-8px">
            <p>
              Modify the <code>createCallbackUrl</code> param in <code>onMounted</code> to test a
              callback.
            </p>
            <code>
              <pre>{{ valueToMakeCallback }}</pre>
            </code>
            <BrandButton v-if="callbackDestination" :href="callbackDestination" :external="true">
              {{ 'Go to Callback URL' }}
            </BrandButton>
            <h4>Full URL Destination</h4>
            <code>
              <pre>{{ callbackDestination }}</pre>
            </code>
          </div>
          <div class="bg-background">
            <hr class="border-black dark:border-white" />
            <h2 class="text-xl font-semibold font-mono">Brand Button Component</h2>
            <template v-for="variant in variants" :key="variant">
              <BrandButton
                :variant="variant"
                type="button"
                size="14px"
                :icon="ExclamationTriangleIcon"
                >{{ variant }}</BrandButton
              >
            </template>
          </div>
          <div class="bg-background">
            <hr class="border-black dark:border-white" />
            <h2 class="text-xl font-semibold font-mono">SSO Button Component</h2>
            <SsoButtonCe :ssoenabled="serverState.ssoEnabled" />
          </div>
          <div class="bg-background">
            <hr class="border-black dark:border-white" />
            <h2 class="text-xl font-semibold font-mono">Log Viewer Component</h2>
            <LogViewerCe />
          </div>
        </div>
      </client-only>
    </div>
    <Toaster rich-colors close-button />
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';

code {
  @apply rounded-lg bg-gray-200 p-1 text-black shadow;
}

pre {
  @apply overflow-x-scroll py-3;
}
</style>
