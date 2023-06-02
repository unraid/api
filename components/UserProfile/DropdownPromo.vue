<script lang="ts" setup>
import type { UserProfilePromoFeature } from '~/types/userProfile';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

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

const installPlugin = (staging = false) => {
  return console.debug(staging ? 'dynamix.unraid.net.staging.plg' : 'dynamix.unraid.net.plg');
};

const installButtonClasses = 'text-white text-14px text-center w-full flex flex-row items-center justify-center gap-x-8px px-8px py-8px cursor-pointer rounded-md bg-gradient-to-r from-red to-orange hover:from-red/60 hover:to-orange/60 focus:from-red/60 focus:to-orange/60';
</script>

<template>
  <div class="text-center relative z-10 w-full max-w-800px p-24px sm:p-32px lg:px-40px">
    <h2 class="text-24px font-semibold my-0">
      Enhance your Unraid experience with these <span class="inline-flex flex-row items-end gap-x-4px"><br class="hidden sm:block"/>Connect <span><UpcBeta /></span></span> features
    </h2>

    <div class="text-12px flex flex-wrap justify-center my-16px">
      <UpcPromoFeature
        v-for="(feature, index) in features"
        :key="index"
        :title="feature.title"
        :copy="feature.copy"
      />
    </div>

    <div class="w-full max-w-xs flex flex-col gap-y-8px mx-auto">
      <!-- v-if="devEnv" -->
      <button @click="installPlugin(true)" :class="installButtonClasses">Install Staging</button>
      <button @click="installPlugin()" :class="installButtonClasses">{{ 'Install Connect' }}</button>
      <div>
        <a
          href="https://docs.unraid.net/category/unraid-connect"
          class="text-12px tracking-wide inline-block mx-8px opacity-60 hover:opacity-100 focus:opacity-100 underline transition"
          target="_blank"
          rel="noopener noreferrer"
          :title="'Checkout the Connect Documentation'"
        >{{ 'Learn More' }}</a>
        <button
          @click="console.debug('Close Promo')"
          class="text-12px tracking-wide inline-block mx-8px opacity-60 hover:opacity-100 focus:opacity-100 underline transition"
          :title="'Close Promo'"
        >
          {{ 'No thanks' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
