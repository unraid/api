<script setup lang="ts">
import { Button } from '@unraid/ui';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { nextTick } from 'vue';

const activationModalStore = useActivationCodeModalStore();

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
</script>

<template>
  <div class="p-8">
    <Button 
      variant="primary"
      @click="showActivationModal"
    >
      Show Activation Modal
    </Button>
  </div>
</template>
