<script setup lang="ts">
import {
  ArrowTopRightOnSquareIcon,
  KeyIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import { DOCS_REGISTRATION_REPLACE_KEY } from '~/helpers/urls';
import { useReplaceRenewStore } from '~/store/replaceRenew';

const replaceRenewStore = useReplaceRenewStore();
const { replaceStatusOutput } = storeToRefs(replaceRenewStore);

defineProps<{
  t: any;
}>();
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-8px">
    <BrandButton
      v-if="!replaceStatusOutput"
      @click="replaceRenewStore.check"
      :icon="KeyIcon"
      :text="t('Check Eligibility')"
      class="flex-grow" />

    <UiBadge
      v-else
      :color="replaceStatusOutput.color"
      :icon="replaceStatusOutput.icon"
      size="16px"
    >
      {{ t(replaceStatusOutput.text) }}
    </UiBadge>

    <BrandButton
      btn-style="underline"
      :external="true"
      :href="DOCS_REGISTRATION_REPLACE_KEY.toString()"
      :iconRight="ArrowTopRightOnSquareIcon"
      :text="t('Learn More')"
      class="text-14px"
    />
  </div>
</template>
