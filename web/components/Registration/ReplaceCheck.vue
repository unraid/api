<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon, KeyIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { DOCS_REGISTRATION_REPLACE_KEY } from '~/helpers/urls';

import type { ComposerTranslation } from 'vue-i18n';

import { useReplaceRenewStore } from '~/store/replaceRenew';

const replaceRenewStore = useReplaceRenewStore();
const { replaceStatusOutput } = storeToRefs(replaceRenewStore);

defineProps<{
  t: ComposerTranslation;
}>();
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-8px">
    <BrandButton
      v-if="!replaceStatusOutput"
      :icon="KeyIcon"
      :text="t('Check Eligibility')"
      class="flex-grow"
      @click="replaceRenewStore.check"
    />

    <UiBadge v-else :color="replaceStatusOutput.color" :icon="replaceStatusOutput.icon" size="16px">
      {{ t(replaceStatusOutput.text ?? 'Unknown') }}
    </UiBadge>

    <span class="inline-flex flex-wrap items-center justify-end gap-8px">
      <BrandButton
        variant="underline"
        :external="true"
        :href="DOCS_REGISTRATION_REPLACE_KEY.toString()"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('Learn More')"
        class="text-14px"
      />
    </span>
  </div>
</template>
