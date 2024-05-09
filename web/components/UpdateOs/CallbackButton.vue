<script setup lang="ts">
import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';

import { useAccountStore } from '~/store/account';
import type { ButtonStyle } from '~/types/ui/button';

defineProps<{
  btnStyle?: ButtonStyle;
  t: any;
}>();

const accountStore = useAccountStore();
</script>

<template>
  <div class="flex flex-col sm:flex-shrink-0 sm:flex-grow-0 items-center">
    <BrandButton
      :btn-style="btnStyle"
      :icon="ArrowPathIcon"
      :icon-right="ArrowTopRightOnSquareIcon"
      :text="t('Check for OS Updates')"
      class="flex-0"
      @click="accountStore.updateOs()"
    />
  </div>
</template>
