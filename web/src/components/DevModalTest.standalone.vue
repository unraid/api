<script setup lang="ts">
import { nextTick } from 'vue';

import { Button } from '@unraid/ui';

import { useOnboardingModalStore } from '~/components/Onboarding/store/onboardingModalVisibility';

const onboardingModalStore = useOnboardingModalStore();

const showOnboardingModal = async () => {
  onboardingModalStore.forceOpenModal();

  // Wait for next tick to ensure the reactive system has updated
  await nextTick();

  // Log the current state for debugging
  console.log('Modal visibility after setting:', onboardingModalStore.isAutoVisible);
  console.log('isHidden value:', onboardingModalStore.isHidden);
};
</script>

<template>
  <div class="p-8">
    <div class="flex gap-2">
      <Button variant="primary" @click="showOnboardingModal"> Show Onboarding Modal </Button>
    </div>
  </div>
</template>
