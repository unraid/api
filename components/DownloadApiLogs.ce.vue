<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ArrowDownTrayIcon } from '@heroicons/vue/24/solid';
import { DEV_GRAPH_URL } from '~/helpers/urls';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { apiKey } = storeToRefs(useServerStore());

const downloadUrl = computed(() => new URL(`/graphql/api/logs?apiKey=${apiKey.value}`, DEV_GRAPH_URL || window.location.origin));
</script>

<template>
  <div class="whitespace-normal flex flex-col gap-y-16px max-w-3xl">
    <span class="leading-8">
      The primary method of support for Unraid Connect is through <a href="https://forums.unraid.net/forum/94-connect-plugin-support/" target="_blank" rel="noopener noreferrer">our forums</a> and <a href="https://discord.gg/unraid" target="_blank" rel="noopener noreferrer">Discord</a>. If you are asked to supply logs, please open a support request on our <a href="https://unraid.net/contact" target="_blank" rel="noopener noreferrer">Contact Page</a> and reply to the email message you receive with your logs attached. The logs may contain sensitive information so do not post them publicly.
    </span>
    <span>
      <a
        :href="downloadUrl.toString()"
        rel="noopener noreferrer"
        class="text-white text-14px text-center w-full flex-none flex flex-row items-center justify-center gap-x-8px px-8px py-8px cursor-pointer rounded-md bg-gradient-to-r from-red to-orange hover:from-red/60 hover:to-orange/60 focus:from-red/60 focus:to-orange/60"
        target="_blank"
        download
      >
        <ArrowDownTrayIcon class="flex-shrink-0 w-14px" />
        {{ 'Download' }}
      </a>
    </span>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
