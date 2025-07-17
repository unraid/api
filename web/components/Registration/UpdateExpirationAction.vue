<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { DOCS_REGISTRATION_LICENSING } from '~/helpers/urls';

import type { ComposerTranslation } from 'vue-i18n';

import useDateTimeHelper from '~/composables/dateTime';
import { useReplaceRenewStore } from '~/store/replaceRenew';
import { useServerStore } from '~/store/server';
import RegistrationUpdateExpiration from './UpdateExpiration.vue';

export interface Props {
  t: ComposerTranslation;
}

const props = defineProps<Props>();

const replaceRenewStore = useReplaceRenewStore();
const serverStore = useServerStore();

const { renewStatus } = storeToRefs(replaceRenewStore);
const { dateTimeFormat, regExp, regUpdatesExpired, renewAction } = storeToRefs(serverStore);

const reload = () => {
  window.location.reload();
};

const { outputDateTimeReadableDiff: readableDiffRegExp, outputDateTimeFormatted: formattedRegExp } =
  useDateTimeHelper(dateTimeFormat.value, props.t, true, regExp.value);

const output = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? `${props.t('Eligible for updates released on or before {0}.', [formattedRegExp.value])} ${props.t('Extend your license to access the latest updates.')}`
      : props.t('Eligible for free feature updates until {0}', [formattedRegExp.value]),
    title: regUpdatesExpired.value
      ? props.t('Ineligible as of {0}', [readableDiffRegExp.value])
      : props.t('Eligible for free feature updates for {0}', [readableDiffRegExp.value]),
  };
});
</script>

<template>
  <div v-if="output" class="flex flex-col gap-2">
    <RegistrationUpdateExpiration :t="t" />

    <p class="text-sm opacity-90">
      <template v-if="renewStatus === 'installed'">
        {{
          t(
            'Your license key was automatically renewed and installed. Reload the page to see updated details.'
          )
        }}
      </template>
    </p>
    <div class="flex flex-wrap items-start justify-between gap-2">
      <BrandButton
        v-if="renewStatus === 'installed'"
        :icon="ArrowPathIcon"
        :text="t('Reload Page')"
        class="grow"
        @click="reload"
      />
      <BrandButton
        v-else-if="regUpdatesExpired"
        :disabled="renewAction?.disabled"
        :external="renewAction?.external"
        :icon="renewAction.icon"
        :icon-right="ArrowTopRightOnSquareIcon"
        :icon-right-hover-display="true"
        :text="t('Extend License')"
        :title="t('Pay your annual fee to continue receiving OS updates.')"
        class="grow"
        @click="renewAction.click?.()"
      />

      <BrandButton
        variant="underline"
        :external="true"
        :href="DOCS_REGISTRATION_LICENSING.toString()"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('Learn More')"
        class="text-sm"
      />
    </div>
  </div>
</template>
