<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { BrandButton, Dialog } from '@unraid/ui';

import ActivationPartnerLogo from '~/components/Activation/ActivationPartnerLogo.vue';
import ActivationSteps from '~/components/Activation/ActivationSteps.vue';
import { useWelcomeModalDataStore } from '~/components/Activation/store/welcomeModalData';
import { useThemeStore } from '~/store/theme';

// Disable attribute inheritance to prevent modelValue from showing on root element
defineOptions({
  inheritAttrs: false,
});

const { t } = useI18n();

const { partnerInfo, loading, isInitialSetup } = storeToRefs(useWelcomeModalDataStore());

const { setTheme } = useThemeStore();

(async () => {
  try {
    await setTheme();
  } catch (error) {
    console.error('Error setting theme:', error);
  }
})();

const title = computed<string>(() =>
  partnerInfo.value?.partnerName
    ? t(`Welcome to your new {0} system, powered by Unraid!`, [partnerInfo.value?.partnerName])
    : t('Welcome to Unraid!')
);

const description = computed<string>(() =>
  t(
    `First, you'll create your device's login credentials, then you'll activate your Unraid license—your device's operating system (OS).`
  )
);

const isLoginPage = computed(() => window.location.pathname.includes('login'));

// Initialize showModal based on conditions
const showModal = ref(isLoginPage.value || isInitialSetup.value);

// Template ref for the teleport container
const modalContainer = ref<HTMLElement>();

const dropdownHide = () => {
  showModal.value = false;
};

const showWelcomeModal = () => {
  showModal.value = true;
};

defineExpose({
  showWelcomeModal,
});
</script>

<template>
  <div>
    <div ref="modalContainer" />
    <Dialog
      :to="modalContainer"
      :model-value="showModal"
      :show-footer="false"
      :show-close-button="isLoginPage"
      size="full"
      class="bg-background"
      @update:model-value="(value) => (showModal = value)"
    >
      <div
        class="flex flex-col items-center justify-start"
        :style="{
          '--text-xs': '0.75rem',
          '--text-sm': '0.875rem',
          '--text-base': '1rem',
          '--text-lg': '1.125rem',
          '--text-xl': '1.25rem',
          '--text-2xl': '1.5rem',
          '--text-3xl': '1.875rem',
          '--text-4xl': '2.25rem',
          '--text-5xl': '3rem',
          '--text-6xl': '3.75rem',
          '--text-7xl': '4.5rem',
          '--text-8xl': '6rem',
          '--text-9xl': '8rem',
          '--spacing': '0.25rem',
        }"
      >
        <div v-if="partnerInfo?.hasPartnerLogo">
          <ActivationPartnerLogo :partner-info="partnerInfo" />
        </div>

        <h1 class="mt-4 text-center text-xl font-semibold sm:text-2xl">{{ title }}</h1>

        <div class="mx-auto my-12 text-center sm:max-w-xl">
          <p class="text-center text-lg opacity-75 sm:text-xl">{{ description }}</p>
        </div>

        <div class="flex flex-col">
          <div class="mx-auto mb-10">
            <BrandButton :text="t('Create a password')" :disabled="loading" @click="dropdownHide" />
          </div>

          <ActivationSteps :active-step="1" class="mt-6" />
        </div>
      </div>
    </Dialog>
  </div>
</template>
