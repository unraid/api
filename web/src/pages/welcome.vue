<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { useWelcomeModalDataStore } from '~/components/Activation/store/welcomeModalData';
import WelcomeModalCe from '~/components/Activation/WelcomeModal.standalone.vue';
import ModalsCe from '~/components/Modals.standalone.vue';
import { useCallbackActionsStore } from '~/store/callbackActions';

const welcomeModalRef = ref<InstanceType<typeof WelcomeModalCe>>();

const modalStore = useActivationCodeModalStore();
const { isVisible } = storeToRefs(modalStore);
const { isFreshInstall } = storeToRefs(useActivationCodeDataStore());
const { isInitialSetup } = storeToRefs(useWelcomeModalDataStore());
const { callbackData } = storeToRefs(useCallbackActionsStore());

/**
 * Forces the activation modal to show - this flag overrides the default logic
 * which only shows the modal if the server is a fresh install and there is no
 * callback data.
 */
const showActivationModal = () => {
  modalStore.setIsHidden(false);
};

const showWelcomeModal = () => {
  if (welcomeModalRef.value) {
    welcomeModalRef.value.showWelcomeModal();
  }
};
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <WelcomeModalCe ref="welcomeModalRef" />
    <ModalsCe />
    <div class="border-muted mt-4 rounded border bg-gray-100 p-4 dark:bg-gray-800">
      <h3 class="mb-2 text-lg font-semibold">Activation Modal Debug Info:</h3>
      <p>Should Show Modal (`showActivationModal`): {{ isVisible }}</p>
      <ul class="ml-4 list-inside list-disc">
        <li>Is Fresh Install - Private (`isFreshInstall`): {{ isFreshInstall }}</li>
        <li>Is Initial Setup - Public (`isInitialSetup`): {{ isInitialSetup }}</li>
        <li>Has Callback Data (`callbackData`): {{ !!callbackData }}</li>
        <li>Manually Hidden (`activationModalHidden`): {{ isVisible }}</li>
      </ul>
      <div class="mt-2 flex gap-2">
        <button
          class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          @click="showActivationModal"
        >
          Show Activation Modal
        </button>
        <button
          class="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          @click="showWelcomeModal"
        >
          Show Welcome Modal
        </button>
      </div>
    </div>
  </div>
</template>
