<script setup lang="ts">
import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';

import type { BrandButtonProps } from '@unraid/ui';
import type { ComposerTranslation } from 'vue-i18n';

import { useAccountStore } from '~/store/account';

defineProps<{
  variant?: BrandButtonProps['variant'];
  t: ComposerTranslation;
}>();

const accountStore = useAccountStore();
</script>

<template>
  <div class="flex flex-col sm:flex-shrink-0 sm:flex-grow-0 items-center">
    <BrandButton
      :variant="variant"
      :icon="ArrowPathIcon"
      :icon-right="ArrowTopRightOnSquareIcon"
      :text="t('Check for OS Updates')"
      class="flex-0"
      @click="accountStore.updateOs()"
    />
  </div>
</template>
