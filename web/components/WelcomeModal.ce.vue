<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { BrandButton } from '@unraid/ui';

import type { Server } from '~/types/server';

import ActivationSteps from '~/components/Activation/Steps.vue';
import { useActivationCodeStore } from '~/store/activationCode';
import { useServerStore } from '~/store/server';

const { t } = useI18n();

export interface Props {
  server?: Server | string;
}
const props = defineProps<Props>();

const activationCodeStore = useActivationCodeStore();
const serverStore = useServerStore();

const { partnerLogo, partnerName } = storeToRefs(activationCodeStore);

const title = computed<string>(() =>
  partnerName.value
    ? t(`Welcome to your new {0} system, powered by Unraid!`, [partnerName.value])
    : t('Welcome to Unraid!')
);

const description = computed<string>(() =>
  t(
    `First, you’ll create your device’s login credentials, then you’ll activate your Unraid license—your device’s operating system (OS).`
  )
);

const showModal = ref<boolean>(true);
const dropdownHide = () => {
  showModal.value = false;
};

watchEffect(() => {
  /**
   * A necessary workaround for how the webgui handles font-size.
   * There's not a shared CSS file between /login and any of the authenticated webgui pages.
   * Which has lead to font-size differences.
   * The authed webgui pages have CSS of `html { font-size: 62.5%; }` which makes REMs act as if the base font-size is 10px.
   * The /login page doesn't do this.
   * So we'll target the HTML element and toggle the font-size to be 62.5% when the modal is open and 100% when it's closed.
   * */
  const $confirmPasswordField = window.document.querySelector('#confirmPassword');

  if ($confirmPasswordField) {
    if (showModal.value) {
      window.document.documentElement.style.setProperty('font-size', '62.5%');
    } else {
      window.document.documentElement.style.setProperty('font-size', '100%');
    }
  }
});

onBeforeMount(() => {
  if (!props.server) {
    throw new Error('Server data not present');
  }

  if (typeof props.server === 'object') {
    // Handles the testing dev Vue component
    serverStore.setServer(props.server);
  } else if (typeof props.server === 'string') {
    // Handle web component
    const parsedServerProp = JSON.parse(props.server);
    serverStore.setServer(parsedServerProp);
  }
});
</script>

<template>
  <div id="modals" ref="modals" class="relative z-[99999]">
    <Modal
      v-if="showModal"
      :t="t"
      :open="showModal"
      :show-close-x="false"
      :title="title"
      :title-in-main="!!partnerLogo"
      :description="description"
      overlay-color="bg-background"
      overlay-opacity="bg-opacity-100"
      max-width="max-w-800px"
      :disable-shadow="true"
      :modal-vertical-center="false"
      :disable-overlay-close="true"
      @close="dropdownHide"
    >
      <template v-if="partnerLogo" #header>
        <ActivationPartnerLogo />
      </template>

      <template #footer>
        <div class="w-full flex gap-8px justify-center mx-auto">
          <BrandButton :text="t('Create a password')" @click="dropdownHide" />
        </div>
      </template>

      <template #subFooter>
        <ActivationSteps :active-step="1" class="hidden sm:flex mt-6" />
      </template>
    </Modal>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '../assets/main.css';

.unraid_mark_2,
.unraid_mark_4 {
  animation: mark_2 1.5s ease infinite;
}
.unraid_mark_3 {
  animation: mark_3 1.5s ease infinite;
}
.unraid_mark_6,
.unraid_mark_8 {
  animation: mark_6 1.5s ease infinite;
}
.unraid_mark_7 {
  animation: mark_7 1.5s ease infinite;
}

@keyframes mark_2 {
  50% {
    transform: translateY(-40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_3 {
  50% {
    transform: translateY(-62px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_6 {
  50% {
    transform: translateY(40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_7 {
  50% {
    transform: translateY(62px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
