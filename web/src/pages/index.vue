<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import UButton from '@nuxt/ui/components/Button.vue';

import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { BrandButton, Toaster } from '@unraid/ui';
import { useDummyServerStore } from '~/_data/serverState';
import AES from 'crypto-js/aes';

import type { SendPayloads } from '@unraid/shared-callbacks';

import WelcomeModalCe from '~/components/Activation/WelcomeModal.ce.vue';
import ConnectSettingsCe from '~/components/ConnectSettings/ConnectSettings.ce.vue';
import DowngradeOsCe from '~/components/DowngradeOs.ce.vue';
import HeaderOsVersionCe from '~/components/HeaderOsVersion.ce.vue';
import LogViewerCe from '~/components/Logs/LogViewer.ce.vue';
import ModalsCe from '~/components/Modals.ce.vue';
import RegistrationCe from '~/components/Registration.ce.vue';
import SsoButtonCe from '~/components/SsoButton.ce.vue';
import UpdateOsCe from '~/components/UpdateOs.ce.vue';
import UserProfileCe from '~/components/UserProfile.ce.vue';
import { useThemeStore } from '~/store/theme';

const serverStore = useDummyServerStore();
const { serverState } = storeToRefs(serverStore);

onMounted(() => {
  document.cookie = 'unraid_session_cookie=mockusersession';
});

const valueToMakeCallback = ref<SendPayloads | undefined>();
const callbackDestination = ref<string | undefined>('');

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

const { theme } = storeToRefs(useThemeStore());
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
  <div class="bg-white text-black dark:bg-black dark:text-white">
    <div class="mx-auto pb-12">
      <div class="flex flex-col gap-6 p-6">
        <h2 class="font-mono text-xl font-semibold">Vue Components</h2>
        <h3 class="font-mono text-lg font-semibold">UserProfileCe</h3>
        <header
          class="bg-header-background-color flex items-center justify-between"
          :style="{
            backgroundImage: bannerImage,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }"
        >
          <div class="inline-flex flex-col items-start gap-4">
            <HeaderOsVersionCe />
          </div>
          <UserProfileCe :server="serverState" />
        </header>
        <!-- <hr class="border-black dark:border-white"> -->

        <h3 class="font-mono text-lg font-semibold">ConnectSettingsCe</h3>
        <ConnectSettingsCe />
        <hr class="border-muted" />

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
        <h3 class="font-mono text-lg font-semibold">UpdateOsCe</h3>
        <UpdateOsCe />
        <hr class="border-muted" />
        <h3 class="font-mono text-lg font-semibold">DowngraadeOsCe</h3>
        <DowngradeOsCe :restore-release-date="'2022-10-10'" :restore-version="'6.11.2'" />
        <hr class="border-muted" />
        <h3 class="font-mono text-lg font-semibold">RegistrationCe</h3>
        <RegistrationCe />
        <hr class="border-muted" />
        <h3 class="font-mono text-lg font-semibold">ModalsCe</h3>
        <ModalsCe />
        <hr class="border-muted" />
        <h3 class="font-mono text-lg font-semibold">WelcomeModalCe</h3>
        <WelcomeModalCe />
        <hr class="border-muted" />
        <h3 class="font-mono text-lg font-semibold">Test Callback Builder</h3>
        <div class="flex flex-col justify-end gap-2">
          <p>
            Modify the <code>createCallbackUrl</code> param in <code>onMounted</code> to test a callback.
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
        <div>
          <hr class="border-muted" />
          <h2 class="font-mono text-xl font-semibold">Nuxt UI Button - Primary Color Test</h2>
          <div class="flex items-center gap-4">
            <UButton color="primary" variant="solid">Primary Solid</UButton>
            <UButton color="primary" variant="outline">Primary Outline</UButton>
            <UButton color="primary" variant="soft">Primary Soft</UButton>
            <UButton color="primary" variant="ghost">Primary Ghost</UButton>
            <UButton color="primary" variant="link">Primary Link</UButton>
          </div>
        </div>
        <div class="bg-background">
          <hr class="border-muted" />
          <h2 class="font-mono text-xl font-semibold">Brand Button Component</h2>
          <template v-for="variant in variants" :key="variant">
            <BrandButton :variant="variant" type="button" size="14px" :icon="ExclamationTriangleIcon">{{
              variant
            }}</BrandButton>
          </template>
        </div>
        <div class="bg-background">
          <hr class="border-muted" />
          <h2 class="font-mono text-xl font-semibold">SSO Button Component</h2>
          <SsoButtonCe />
        </div>
        <div class="bg-background">
          <hr class="border-muted" />
          <h2 class="font-mono text-xl font-semibold">Log Viewer Component</h2>
          <LogViewerCe />
        </div>
      </div>
    </div>
    <Toaster rich-colors close-button />
  </div>
</template>
