<script lang="ts" setup>
/**
 * @todo devEnv should be a .env variable so we can gate staging installs
 *
 * @todo future idea – turn this into a carousel. each feature could have a short video if we ever them
 */
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue';
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';

import useInstallPlugin from '~/composables/installPlugin';
import { CONNECT_DOCS } from '~/helpers/urls';
import { usePromoStore } from '~/store/promo';
import type { UserProfilePromoFeature } from '~/types/userProfile';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

export interface Props {
  open?: boolean;
  t: any;
}

withDefaults(defineProps<Props>(), {
  open: false,
});

const promoStore = usePromoStore();

/**
 * These are translated in the component below. So if you add a new feature, make sure to add it to the translation file.
 */
const features = ref<UserProfilePromoFeature[]>([
  {
    title: 'Dynamic Remote Access',
    copy: 'Toggle on/off server accessibility with dynamic remote access. Automatically turn on UPnP and open a random WAN port on your router at the click of a button and close off access in seconds.',
  },
  {
    title: 'Manage Your Server Within Connect',
    copy: 'Servers equipped with a myunraid.net certificate can be managed directly from within the Connect web UI. Manage multiple servers from your phone, tablet, laptop, or PC in the same browser window.',
  },
  {
    title: 'Deep Linking',
    copy: 'The Connect dashboard links to relevant sections of the webgui, allowing quick access to those settings and server sections.',
  },
  {
    title: 'Online Flash Backup',
    copy: 'Never ever be left without a backup of your config. If you need to change flash drives, generate a backup from Connect and be up and running in minutes.',
  },
  {
    title: 'Real-time Monitoring',
    copy: 'Get an overview of your server\'s state, storage space, apps and VMs status, and more.',
  },
  {
    title: 'Customizable Dashboard Tiles',
    copy: 'Set custom server tiles how you like and automatically display your server\'s banner image on your Connect Dashboard.',
  },
  {
    title: 'License Management',
    copy: 'Manage your license keys at any time via the My Keys section.',
  },
  {
    title: 'Plus more on the way',
    copy: 'All you need is an active internet connection, an Unraid.net account, and the Connect plugin. Get started by installing the plugin.',
  },
]);

const staging = ref(false);
const { install } = useInstallPlugin();
</script>

<template>
  <Modal
    :t="t"
    :title="t('Introducing Unraid Connect')"
    :description="t('Enhance your Unraid experience')"
    :open="open"
    :show-close-x="true"
    max-width="max-w-800px"
    @close="promoStore.promoHide()"
  >
    <template #headerTitle>
      <span><UpcBeta class="relative -top-1" /></span>
    </template>

    <template #main>
      <div class="text-center relative w-full">
        <div class="grid grid-cols-1 sm:grid-cols-2 justify-center p-16px md:py-24px gap-16px">
          <UpcPromoFeature
            v-for="(feature, index) in features"
            :key="index"
            :title="t(feature.title)"
            :copy="t(feature.copy)"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="w-full max-w-xs flex flex-col items-center gap-y-16px mx-auto">
        <SwitchGroup v-if="import.meta.env.DEV" as="div" class="flex items-center justify-center">
          <Switch v-model="staging" :class="[staging ? 'bg-indigo-600' : 'bg-gray-200', 'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2']">
            <span aria-hidden="true" :class="[staging ? 't-x-5' : 't-x-0', 'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out']" />
          </Switch>
          <SwitchLabel as="span" class="ml-3 text-12px">
            <span class="font-semibold">Install Staging</span>
          </SwitchLabel>
        </SwitchGroup>
        <button
          class="text-white text-14px text-center w-full flex flex-row items-center justify-center gap-x-8px px-8px py-8px cursor-pointer rounded-md bg-gradient-to-r from-unraid-red to-orange hover:from-unraid-red/60 hover:to-orange/60 focus:from-unraid-red/60 focus:to-orange/60"
          @click="install({ staging, update: false })"
        >
          {{ staging ? 'Install Connect Staging' : t('Install Connect') }}
        </button>
        <div>
          <a
            :href="CONNECT_DOCS.toString()"
            class="text-12px tracking-wide inline-flex flex-row items-center justify-start gap-8px mx-8px opacity-60 hover:opacity-100 focus:opacity-100 underline transition"
            target="_blank"
            rel="noopener noreferrer"
            :title="t('Checkout the Connect Documentation')"
          >
            {{ t('Learn More') }}
            <ArrowTopRightOnSquareIcon class="w-16px" />
          </a>
          <button
            class="text-12px tracking-wide inline-block mx-8px opacity-60 hover:opacity-100 focus:opacity-100 underline transition"
            :title="t('Close')"
            @click="promoStore.promoHide()"
          >
            {{ t('No thanks') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
