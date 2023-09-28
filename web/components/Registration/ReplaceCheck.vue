<script setup lang="ts">
import {
  ArrowTopRightOnSquareIcon,
  KeyIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import BrandLoadingWhite from '~/components/Brand/LoadingWhite.vue';
import { useReplaceCheckStore } from '~/store/replaceCheck';

const replaceCheckStore = useReplaceCheckStore();
const { status, statusOutput } = storeToRefs(replaceCheckStore);

const props = defineProps<{
  t: any;
}>();
</script>

<template>
  <div class="flex flex-col">
    <BrandButton
      v-if="status === 'checking' || status === 'ready'"
      @click="replaceCheckStore.check"
      :disabled="status !== 'ready'"
      :icon="status === 'checking' ? BrandLoadingWhite : KeyIcon"
      :text="t('Check Eligibility')"
      class="w-full sm:max-w-300px" />

    <p
      v-else-if="statusOutput"
      class="flex flex-col sm:flex-row items-start justify-between gap-4px"
    >
      <UiBadge :color="statusOutput.color" :icon="statusOutput.icon" size="16px">
        {{ t(statusOutput.text) }}
      </UiBadge>
      <BrandButton
        v-if="status !== 'checking' || status === 'ready'"
        btn-style="underline"
        :external="true"
        :href="'https://docs.unraid.net/unraid-os/manual/changing-the-flash-device/'"
        :iconRight="ArrowTopRightOnSquareIcon"
        :text="t('Learn More')"
      />
    </p>
  </div>
</template>
