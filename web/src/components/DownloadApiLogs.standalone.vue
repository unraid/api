<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { CONNECT_FORUMS, CONTACT, DISCORD, WEBGUI_GRAPHQL } from '~/helpers/urls';

const { t } = useI18n();

const downloadUrl = computed(() => {
  const url = new URL(`/graphql/api/logs`, WEBGUI_GRAPHQL);
  url.searchParams.append('csrf_token', globalThis.csrf_token);
  return url;
});
</script>

<template>
  <div class="flex max-w-3xl flex-col gap-y-4 whitespace-normal">
    <p class="text-start text-sm">
      {{ t('downloadApiLogs.thePrimaryMethodOfSupportFor') }}
      {{ t('downloadApiLogs.ifYouAreAskedToSupply') }}
      {{ t('downloadApiLogs.theLogsMayContainSensitiveInformation') }}
    </p>
    <span class="flex flex-col gap-y-4">
      <div class="flex">
        <BrandButton
          class="shrink-0 grow-0"
          download
          :external="true"
          :href="downloadUrl.toString()"
          :icon="ArrowDownTrayIcon"
          size="12px"
          :text="t('downloadApiLogs.downloadUnraidApiLogs')"
        />
      </div>

      <div class="flex flex-row items-baseline gap-2">
        <a
          :href="CONNECT_FORUMS.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex flex-row items-center justify-start gap-2 text-[#486dba] hover:text-[#3b5ea9] hover:underline focus:text-[#3b5ea9] focus:underline"
        >
          {{ t('downloadApiLogs.unraidConnectForums') }}
          <ArrowTopRightOnSquareIcon class="w-4" />
        </a>
        <a
          :href="DISCORD.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex flex-row items-center justify-start gap-2 text-[#486dba] hover:text-[#3b5ea9] hover:underline focus:text-[#3b5ea9] focus:underline"
        >
          {{ t('downloadApiLogs.unraidDiscord') }}
          <ArrowTopRightOnSquareIcon class="w-4" />
        </a>
        <a
          :href="CONTACT.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex flex-row items-center justify-start gap-2 text-[#486dba] hover:text-[#3b5ea9] hover:underline focus:text-[#3b5ea9] focus:underline"
        >
          {{ t('downloadApiLogs.unraidContactPage') }}
          <ArrowTopRightOnSquareIcon class="w-4" />
        </a>
      </div>
    </span>
  </div>
</template>
