<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useCallbackActionsStore } from '~/store/callbackActions';
import WelcomeModalCe from '~/components/Activation/WelcomeModal.ce.vue';
import ModalsCe from '~/components/Modals.ce.vue';

const modalStore = useActivationCodeModalStore();
const { isVisible } = storeToRefs(modalStore);
const { isFreshInstall } = storeToRefs(useActivationCodeDataStore());
const { callbackData } = storeToRefs(useCallbackActionsStore());

/**
 * Forces the activation modal to show - this flag overrides the default logic
 * which only shows the modal if the server is a fresh install and there is no
 * callback data.
 */
const showActivationModal = () => {
  modalStore.setIsHidden(false);
};


</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <WelcomeModalCe />
    <ModalsCe />
    <div class="mt-4 p-4 border rounded bg-gray-100 dark:bg-gray-800">
      <h3 class="text-lg font-semibold mb-2">Activation Modal Debug Info:</h3>
      <p>Should Show Modal (`showActivationModal`): {{ isVisible }}</p>
      <ul class="list-disc list-inside ml-4">
        <li>Is Fresh Install (`isFreshInstall`): {{ isFreshInstall }}</li>
        <li>Has Callback Data (`callbackData`): {{ !!callbackData }}</li>
        <li>Manually Hidden (`activationModalHidden`): {{ isVisible }}</li>
      </ul>
      <button
        class="mt-2 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
        @click="showActivationModal"
      >
        Show Activation Modal
      </button>
    </div>

  </div>
</template>
