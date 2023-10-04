<script setup lang="ts">
import {
  ArrowTopRightOnSquareIcon,
  KeyIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import { DOCS_REGISTRATION_REPLACE_KEY } from '~/helpers/urls';
import BrandLoadingWhite from '~/components/Brand/LoadingWhite.vue';
import { useReplaceRenewStore } from '~/store/replaceRenew';

const replaceRenewStore = useReplaceRenewStore();
const { status, statusOutput } = storeToRefs(replaceRenewStore);

defineProps<{
  t: any;
}>();
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-8px">
    <BrandButton
      v-if="status === 'checking' || status === 'ready'"
      @click="replaceRenewStore.check"
      :disabled="status !== 'ready'"
      :icon="status === 'checking' ? BrandLoadingWhite : KeyIcon"
      :text="status === 'checking' ? t('Checking...') : t('Check Eligibility')"
      class="flex-grow" />

    <UiBadge
      v-else-if="statusOutput"
      :color="statusOutput.color"
      :icon="statusOutput.icon"
      size="16px"
    >
      {{ t(statusOutput.text) }}
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
