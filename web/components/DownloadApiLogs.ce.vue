<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { Button } from '@unraid/ui';
import { CONNECT_FORUMS, CONTACT, DISCORD, WEBGUI_GRAPHQL } from '~/helpers/urls';

const { t } = useI18n();

const downloadUrl = computed(() => {
  const url = new URL(`/graphql/api/logs`, WEBGUI_GRAPHQL);
  url.searchParams.append('csrf_token', globalThis.csrf_token);
  return url;
});
</script>

<template>
  <div class="whitespace-normal flex flex-col gap-y-16px max-w-3xl">
    <span>
      {{ t('The primary method of support for Unraid Connect is through our forums and Discord.') }}
      {{
        t(
          'If you are asked to supply logs, please open a support request on our Contact Page and reply to the email message you receive with your logs attached.'
        )
      }}
      {{ t('The logs may contain sensitive information so do not post them publicly.') }}
    </span>
    <span class="flex flex-col gap-y-16px">
      <div class="flex">
        <Button
          variant="primary"
          class="grow-0 shrink-0"
          download
          :external="true"
          :href="downloadUrl.toString()"
          :icon="ArrowDownTrayIcon"
          size="md"
          >{{ t('Download unraid-api Logs') }}</Button
        >
      </div>

      <div class="flex flex-row items-baseline gap-8px">
        <a
          :href="CONNECT_FORUMS.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#486dba] hover:text-[#3b5ea9] focus:text-[#3b5ea9] hover:underline focus:underline inline-flex flex-row items-center justify-start gap-8px"
        >
          {{ t('Unraid Connect Forums') }}
          <ArrowTopRightOnSquareIcon class="w-16px" />
        </a>
        <a
          :href="DISCORD.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#486dba] hover:text-[#3b5ea9] focus:text-[#3b5ea9] hover:underline focus:underline inline-flex flex-row items-center justify-start gap-8px"
        >
          {{ t('Unraid Discord') }}
          <ArrowTopRightOnSquareIcon class="w-16px" />
        </a>
        <a
          :href="CONTACT.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#486dba] hover:text-[#3b5ea9] focus:text-[#3b5ea9] hover:underline focus:underline inline-flex flex-row items-center justify-start gap-8px"
        >
          {{ t('Unraid Contact Page') }}
          <ArrowTopRightOnSquareIcon class="w-16px" />
        </a>
      </div>
    </span>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
