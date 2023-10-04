<script setup lang="ts">
import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import useTimeHelper from '~/composables/time';
import { DOCS_REGISTRATION_LICENSING } from '~/helpers/urls';
import { useReplaceRenewStore } from '~/store/replaceRenew';
import { useServerStore } from '~/store/server';

export interface Props {
  t: any;
}

const props = defineProps<Props>();

const replaceRenewStore = useReplaceRenewStore();
const serverStore = useServerStore();

const { renewStatus } = storeToRefs(replaceRenewStore);
const {
  dateTimeFormat,
  regExp,
  regUpdatesExpired,
  renewAction,
} = storeToRefs(serverStore);

const reload = () => {
  window.location.reload();
};

const { buildStringFromValues, dateDiff, formatDate } = useTimeHelper(dateTimeFormat.value, props.t);

const parsedTime = ref<string>('');
const formattedTime = computed<string>(() => formatDate(regExp.value));

const output = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? props.t('Ineligible for updates released after {0}', [formattedTime.value])
      : props.t('Eligible for updates until {0}', [formattedTime.value]),
    title: regUpdatesExpired.value
      ? props.t('Ineligible as of {0}', [parsedTime.value])
      : props.t('Eligible for updates for {0}', [parsedTime.value]),
  };
});

const runDiff = () => {
  parsedTime.value = buildStringFromValues(dateDiff((regExp.value).toString(), false));
};

let interval: string | number | NodeJS.Timeout | undefined;
onBeforeMount(() => {
  runDiff();
  interval = setInterval(() => {
    runDiff();
  }, 1000);
});

onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>

<template>
  <div v-if="output" class="flex flex-col gap-8px">
    <RegistrationUpdateExpiration :t="t" />

    <p v-if="renewStatus === 'installed' || regUpdatesExpired" class="text-14px opacity-90">
      <template v-if="renewStatus === 'installed'">
        {{ t('Your license key was automatically renewed and installed. Reload the page to see updated details.') }}
      </template>
      <em v-else-if="regUpdatesExpired">
        {{ t('Pay your annual fee to continue receiving OS updates.') }} {{ t('You may still update to releases dated prior to your update expiration date.') }}
      </em>
    </p>
    <div class="flex flex-wrap items-start justify-between gap-8px">
      <BrandButton
        v-if="renewStatus === 'installed'"
        :icon="ArrowPathIcon"
        :text="t('Reload Page')"
        @click="reload"
        class="flex-grow"
       />
      <BrandButton
        v-else-if="regUpdatesExpired"
        :disabled="renewAction?.disabled"
        :external="renewAction?.external"
        :icon="renewAction.icon"
        :icon-right="ArrowTopRightOnSquareIcon"
        :icon-right-hover="true"
        :text="t('Renew Key')"
        @click="renewAction.click()"
        :title="t('Pay your annual fee to continue receiving OS updates.')"
        class="flex-grow"
      />

      <BrandButton
        btn-style="underline"
        :external="true"
        :href="DOCS_REGISTRATION_LICENSING.toString()"
        :iconRight="ArrowTopRightOnSquareIcon"
        :text="t('Learn More')"
        class="text-14px"
      />
    </div>
  </div>
</template>
