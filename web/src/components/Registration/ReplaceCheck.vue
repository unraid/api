<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { ArrowPathIcon, ArrowTopRightOnSquareIcon, KeyIcon } from '@heroicons/vue/24/solid';
import { Badge, BrandButton } from '@unraid/ui';
import { DOCS_REGISTRATION_REPLACE_KEY } from '~/helpers/urls';

import { useReplaceRenewStore } from '~/store/replaceRenew';

const { t } = useI18n();
const replaceRenewStore = useReplaceRenewStore();
const { replaceStatusOutput } = storeToRefs(replaceRenewStore);

const isError = computed(() => replaceStatusOutput.value?.variant === 'red');
const showButton = computed(() => !replaceStatusOutput.value || isError.value);

const handleCheck = () => {
  if (isError.value) {
    replaceRenewStore.reset();
  }
  replaceRenewStore.check(true);
};
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <BrandButton
      v-if="showButton"
      :icon="isError ? ArrowPathIcon : KeyIcon"
      :text="isError ? t('common.retry') : t('registration.replaceCheck.checkEligibility')"
      class="grow"
      @click="handleCheck"
    />

    <Badge v-else :variant="replaceStatusOutput?.variant" :icon="replaceStatusOutput?.icon" size="md">
      {{ t(replaceStatusOutput?.text ?? 'Unknown') }}
    </Badge>

    <span class="inline-flex flex-wrap items-center justify-end gap-2">
      <BrandButton
        variant="underline"
        :external="true"
        :href="DOCS_REGISTRATION_REPLACE_KEY.toString()"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('registration.keyLinkedStatus.learnMore')"
        class="text-sm"
      />
    </span>
  </div>
</template>
