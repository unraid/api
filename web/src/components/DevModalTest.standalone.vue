<script setup lang="ts">
import { nextTick, ref } from 'vue';

import { Button } from '@unraid/ui';

import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import WelcomeModalCe from '~/components/Activation/WelcomeModal.standalone.vue';

const activationModalStore = useActivationCodeModalStore();
const welcomeModalRef = ref<InstanceType<typeof WelcomeModalCe>>();

const showActivationModal = async () => {
  // First set the value in sessionStorage to persist the state
  sessionStorage.setItem('activationCodeModalHidden', 'false');

  // Then update the store
  activationModalStore.setIsHidden(false);

  // Wait for next tick to ensure the reactive system has updated
  await nextTick();

  // Log the current state for debugging
  console.log('Modal visibility after setting:', activationModalStore.isVisible);
  console.log('isHidden value:', activationModalStore.isHidden);
};

const showWelcomeModal = () => {
  if (welcomeModalRef.value) {
    welcomeModalRef.value.showWelcomeModal();
  }
};
</script>

<template>
  <div class="p-8">
    <WelcomeModalCe ref="welcomeModalRef" />
    <div class="flex gap-2">
      <Button variant="primary" @click="showActivationModal"> Show Activation Modal </Button>
      <Button variant="secondary" @click="showWelcomeModal"> Show Welcome Modal </Button>
    </div>
  </div>
</template>
