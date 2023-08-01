<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { useI18n } from 'vue-i18n';

import { DEV_GRAPH_URL, CONNECT_FORUMS, CONTACT, DISCORD } from '~/helpers/urls';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { t } = useI18n();

const { apiKey } = storeToRefs(useServerStore());

const downloadUrl = computed(() => new URL(`/graphql/api/logs?apiKey=${apiKey.value}`, DEV_GRAPH_URL || window.location.origin));
</script>

<template>
  <div class="whitespace-normal flex flex-col gap-y-16px max-w-3xl">
    <span class="leading-8">
      {{ t('The primary method of support for Unraid Connect is through our forums and Discord.') }}
      {{ t('If you are asked to supply logs, please open a support request on our Contact Page and reply to the email message you receive with your logs attached.') }}
      {{ t('The logs may contain sensitive information so do not post them publicly.') }}
    </span>
    <span class="flex flex-col gap-y-16px">
      <div class="flex">
        <BrandButton
          class="grow-0 shrink-0"
          download
          :external="true"
          :href="downloadUrl.toString()"
          :icon="ArrowDownTrayIcon"
          :text="t('Download unraid-api Logs')"
        />
      </div>

      <div class="flex flex-row items-baseline gap-8px">
        <a :href="CONNECT_FORUMS" target="_blank" rel="noopener noreferrer" class="text-[#486dba] hover:text-[#3b5ea9] focus:text-[#3b5ea9] hover:underline focus:underline inline-flex flex-row items-center justify-start gap-8px">
          {{ t('Unraid Connect Forums') }}
          <ArrowTopRightOnSquareIcon class="w-16px" />
        </a>
        <a :href="DISCORD" target="_blank" rel="noopener noreferrer" class="text-[#486dba] hover:text-[#3b5ea9] focus:text-[#3b5ea9] hover:underline focus:underline inline-flex flex-row items-center justify-start gap-8px">
          {{ t('Unraid Discord') }}
          <ArrowTopRightOnSquareIcon class="w-16px" />
        </a>
        <a :href="CONTACT" target="_blank" rel="noopener noreferrer" class="text-[#486dba] hover:text-[#3b5ea9] focus:text-[#3b5ea9] hover:underline focus:underline inline-flex flex-row items-center justify-start gap-8px">
          {{ t('Unraid Contact Page') }}
          <ArrowTopRightOnSquareIcon class="w-16px" />
        </a>
      </div>
    </span>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
