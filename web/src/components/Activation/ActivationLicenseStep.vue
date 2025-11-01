<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';

import type { BrandButtonProps } from '@unraid/ui';

defineProps<{
  modalTitle: string;
  modalDescription: string;
  docsButtons: BrandButtonProps[];
  canGoBack: boolean;
  onBack?: () => void;
  purchaseStore: { activate: () => void };
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex w-full flex-col items-center">
    <h1 class="mt-4 text-center text-xl font-semibold sm:text-2xl">{{ modalTitle }}</h1>

    <div class="mx-auto my-12 text-center sm:max-w-xl">
      <p class="text-center text-lg opacity-75 sm:text-xl">{{ modalDescription }}</p>
    </div>

    <div class="flex flex-col">
      <div class="mx-auto mb-10 flex gap-4">
        <BrandButton v-if="canGoBack" :text="t('common.back')" variant="outline" @click="onBack?.()" />
        <BrandButton
          :text="t('activation.activationModal.activateNow')"
          :icon-right="ArrowTopRightOnSquareIcon"
          @click="purchaseStore.activate"
        />
      </div>

      <div class="mt-6 flex flex-col gap-6">
        <div class="mx-auto flex w-full flex-col justify-center gap-4 sm:flex-row">
          <BrandButton v-for="button in docsButtons" :key="button.text" v-bind="button" />
        </div>
      </div>
    </div>
  </div>
</template>
