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
      {{ t('The primary method of support for Unraid Connect is through our forums and Discord.') }}
      {{
        t(
          'If you are asked to supply logs, please open a support request on our Contact Page and reply to the email message you receive with your logs attached.'
        )
      }}
      {{ t('The logs may contain sensitive information so do not post them publicly.') }}
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
          :text="t('Download unraid-api Logs')"
        />
      </div>

      <div class="flex flex-row items-baseline gap-2">
        <a
          :href="CONNECT_FORUMS.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex flex-row items-center justify-start gap-2 text-[#486dba] hover:text-[#3b5ea9] hover:underline focus:text-[#3b5ea9] focus:underline"
        >
          {{ t('Unraid Connect Forums') }}
          <ArrowTopRightOnSquareIcon class="w-4" />
        </a>
        <a
          :href="DISCORD.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex flex-row items-center justify-start gap-2 text-[#486dba] hover:text-[#3b5ea9] hover:underline focus:text-[#3b5ea9] focus:underline"
        >
          {{ t('Unraid Discord') }}
          <ArrowTopRightOnSquareIcon class="w-4" />
        </a>
        <a
          :href="CONTACT.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex flex-row items-center justify-start gap-2 text-[#486dba] hover:text-[#3b5ea9] hover:underline focus:text-[#3b5ea9] focus:underline"
        >
          {{ t('Unraid Contact Page') }}
          <ArrowTopRightOnSquareIcon class="w-4" />
        </a>
      </div>
    </span>
  </div>
</template>
