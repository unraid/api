<script setup lang="ts">
import {
  ArrowTopRightOnSquareIcon,
  KeyIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import { DOCS_REGISTRATION_REPLACE_KEY } from '~/helpers/urls';
import BrandLoadingWhite from '~/components/Brand/LoadingWhite.vue';
import { useReplaceCheckStore } from '~/store/replaceCheck';

const replaceCheckStore = useReplaceCheckStore();
const { status, statusOutput } = storeToRefs(replaceCheckStore);

const props = defineProps<{
  t: any;
}>();
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-8px">
    <BrandButton
      v-if="status === 'checking' || status === 'ready'"
      @click="replaceCheckStore.check"
      :disabled="status !== 'ready'"
      :icon="status === 'checking' ? BrandLoadingWhite : KeyIcon"
      :text="t('Check Eligibility')"
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
