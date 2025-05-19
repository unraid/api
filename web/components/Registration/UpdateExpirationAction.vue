<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { DOCS_REGISTRATION_LICENSING } from '~/helpers/urls';

import useDateTimeHelper from '~/composables/dateTime';
import { useI18n } from '~/composables/useI18n';
import { useReplaceRenewStore } from '~/store/replaceRenew';
import { useServerStore } from '~/store/server';

const { $gettext, $t } = useI18n();

const replaceRenewStore = useReplaceRenewStore();
const serverStore = useServerStore();

const { renewStatus } = storeToRefs(replaceRenewStore);
const { dateTimeFormat, regExp, regUpdatesExpired, renewAction } = storeToRefs(serverStore);

const reload = () => {
  window.location.reload();
};

const formatDateTimeFunc = (text: string) => $gettext(text);

const { outputDateTimeReadableDiff: readableDiffRegExp, outputDateTimeFormatted: formattedRegExp } =
  useDateTimeHelper(dateTimeFormat.value, formatDateTimeFunc, true, regExp.value);

const output = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? `${$t('Eligible for updates released on or before {0}.', [formattedRegExp.value])} ${$gettext('Extend your license to access the latest updates.')}`
      : $t('Eligible for free feature updates until {0}', [formattedRegExp.value]),
    title: regUpdatesExpired.value
      ? $t('Ineligible as of {0}', [readableDiffRegExp.value])
      : $t('Eligible for free feature updates for {0}', [readableDiffRegExp.value]),
  };
});
</script>

<template>
  <div v-if="output" class="flex flex-col gap-8px">
    <RegistrationUpdateExpiration />

    <p class="text-14px opacity-90">
      <template v-if="renewStatus === 'installed'">
        {{
          $gettext(
            'Your license key was automatically renewed and installed. Reload the page to see updated details.'
          )
        }}
      </template>
    </p>
    <div class="flex flex-wrap items-start justify-between gap-8px">
      <BrandButton
        v-if="renewStatus === 'installed'"
        :icon="ArrowPathIcon"
        :text="$gettext('Reload Page')"
        class="flex-grow"
        @click="reload"
      />
      <BrandButton
        v-else-if="regUpdatesExpired"
        :disabled="renewAction?.disabled"
        :external="renewAction?.external"
        :icon="renewAction.icon"
        :icon-right="ArrowTopRightOnSquareIcon"
        :icon-right-hover-display="true"
        :text="$gettext('Extend License')"
        :title="$gettext('Pay your annual fee to continue receiving OS updates.')"
        class="flex-grow"
        @click="renewAction.click?.()"
      />

      <BrandButton
        variant="underline"
        :external="true"
        :href="DOCS_REGISTRATION_LICENSING.toString()"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="$gettext('Learn More')"
        class="text-14px"
      />
    </div>
  </div>
</template>
