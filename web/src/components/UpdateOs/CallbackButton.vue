<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';

import type { BrandButtonProps } from '@unraid/ui';

import { useAccountStore } from '~/store/account';

const { variant } = defineProps<{
  variant?: BrandButtonProps['variant'];
}>();
const { t } = useI18n();

const accountStore = useAccountStore();
</script>

<template>
  <div class="flex flex-col items-center sm:shrink-0 sm:grow-0">
    <BrandButton
      :variant="variant"
      :icon="ArrowPathIcon"
      :icon-right="ArrowTopRightOnSquareIcon"
      :text="t('updateOs.callbackButton.checkForOsUpdates')"
      class="flex-0"
      @click="accountStore.updateOs()"
    />
  </div>
</template>
