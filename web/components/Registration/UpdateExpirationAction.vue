<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import useTimeHelper from '~/composables/time';
import { DOCS_REGISTRATION_LICENSING } from '~/helpers/urls';
import { useServerStore } from '~/store/server';

export interface Props {
  t: any;
}

const props = defineProps<Props>();

const serverStore = useServerStore();
const { dateTimeFormat, regExp, regUpdatesExpired, renewAction } = storeToRefs(serverStore);

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

    <template v-if="regUpdatesExpired">
      <p class="text-14px opacity-90">
        <em>{{ t('Pay your annual fee to continue receiving OS updates.') }} {{ t('You may still update to releases dated prior to your update expiration date.') }}</em>
      </p>
    </template>
    <div class="flex flex-wrap items-start justify-between gap-8px">
      <BrandButton
        v-if="regUpdatesExpired"
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
