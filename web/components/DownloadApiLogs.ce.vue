<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '~/composables/useI18n';

import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { CONNECT_FORUMS, CONTACT, DISCORD, WEBGUI_GRAPHQL } from '~/helpers/urls';

const { $gettext } = useI18n();

const downloadUrl = computed(() => {
  const url = new URL(`/graphql/api/logs`, WEBGUI_GRAPHQL);
  url.searchParams.append('csrf_token', globalThis.csrf_token);
  return url;
});
</script>

<template>
  <div class="whitespace-normal flex flex-col gap-y-16px max-w-3xl">
    <span>
      {{ $gettext('The primary method of support for Unraid Connect is through our forums and Discord.') }}
      {{
        $gettext(
          'If you are asked to supply logs, please open a support request on our Contact Page and reply to the email message you receive with your logs attached.'
        )
      }}
      {{ $gettext('The logs may contain sensitive information so do not post them publicly.') }}
    </span>
    <span class="flex flex-col gap-y-16px">
      <div class="flex">
        <BrandButton
          class="grow-0 shrink-0"
          download
          :external="true"
          :href="downloadUrl.toString()"
          :icon="ArrowDownTrayIcon"
          size="12px"
          :text="$gettext('Download unraid-api Logs')"
        />
      </div>

      <div class="flex flex-row items-baseline gap-8px">
        <a
          :href="CONNECT_FORUMS.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#486dba] hover:text-[#3b5ea9] focus:text-[#3b5ea9] hover:underline focus:underline inline-flex flex-row items-center justify-start gap-8px"
        >
          {{ $gettext('Unraid Connect Forums') }}
          <ArrowTopRightOnSquareIcon class="w-16px" />
        </a>
        <a
          :href="DISCORD.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#486dba] hover:text-[#3b5ea9] focus:text-[#3b5ea9] hover:underline focus:underline inline-flex flex-row items-center justify-start gap-8px"
        >
          {{ $gettext('Unraid Discord') }}
          <ArrowTopRightOnSquareIcon class="w-16px" />
        </a>
        <a
          :href="CONTACT.toString()"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#486dba] hover:text-[#3b5ea9] focus:text-[#3b5ea9] hover:underline focus:underline inline-flex flex-row items-center justify-start gap-8px"
        >
          {{ $gettext('Unraid Contact Page') }}
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
