<script lang="ts" setup>
import {
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/solid';
import { serverState } from '~/_data/serverState';
import type { SendPayloads } from '~/store/callback';
import type { UiBadgePropsColor } from '~/types/ui/badge';
import type { ButtonStyle } from '~/types/ui/button';
import AES from 'crypto-js/aes';
import BrandButton from '~/components/Brand/Button.vue';
const { registerEntry } = useCustomElements();
onBeforeMount(() => {
  registerEntry('UnraidComponents');
});

useHead({
  meta: [
    { name: 'viewport',
    content: 'width=1300', }
]
})

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

const badgeColors = [
  'black',
  'white',
  'red',
  'yellow',
  'green',
  'blue',
  'indigo',
  'purple',
  'pink',
  'orange',
  'transparent',
  'current',
  'gray',
  'custom',
] as UiBadgePropsColor[];

const buttonColors = [
  'black',
  'fill',
  'gray',
  'outline',
  'outline-black',
  'outline-white',
  'underline',
  'underline-hover-red',
  'white',
] as ButtonStyle[];
</script>

<template>
  <div class="text-black bg-white dark:text-white dark:bg-black">
    <div class="pb-12 mx-auto">
      <client-only>
        <div class="flex flex-col gap-6 p-6">
          <ColorSwitcherCe />
          <h2 class="text-xl font-semibold font-mono">Vue Components</h2>
          <h3 class="text-lg font-semibold font-mono">UserProfileCe</h3>
          <header class="bg-header-background-color py-4 flex flex-row justify-between items-center">
            <div class="inline-flex flex-col gap-4 items-start px-4">
              <a href="https://unraid.net" target="_blank">
                <BrandLogo class="w-[100px] sm:w-[150px]" />
              </a>
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
          <WelcomeModalCe :data="serverState?.activationCodeData ?? undefined" />
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
          <h2 class="text-xl font-semibold font-mono">Legacy Badge Components</h2>
            <template v-for="color in badgeColors" :key="color">
              <UiBadge size="14px" :icon="ExclamationTriangleIcon" :color="color">{{ color }}</UiBadge>
            </template>
          </div>
           <div class="bg-background">
          <hr class="border-black dark:border-white" />
          <h2 class="text-xl font-semibold font-mono">Legacy Button Components</h2>
            <template v-for="color in buttonColors" :key="color">
              <BrandButton type="button" size="14px" :icon="ExclamationTriangleIcon" :btn-style="color as ButtonStyle">{{ color }}</BrandButton>
            </template>
          </div>
        </div>
      </client-only>
    </div>
  </div>
</template>

<style lang="postcss">
code {
  @apply rounded-lg bg-gray-200 p-1 text-black shadow;
}

pre {
  @apply overflow-x-scroll py-3;
}
</style>
