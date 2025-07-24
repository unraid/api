<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { BrandButton, Dialog } from '@unraid/ui';

import ActivationPartnerLogo from '~/components/Activation/ActivationPartnerLogo.vue';
import ActivationSteps from '~/components/Activation/ActivationSteps.vue';
import { useWelcomeModalDataStore } from '~/components/Activation/store/welcomeModalData';
import { useThemeStore } from '~/store/theme';

const { t } = useI18n();

const { partnerInfo, loading } = storeToRefs(useWelcomeModalDataStore());

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

const showModal = ref(false);
const dropdownHide = () => {
  showModal.value = false;
};

const showWelcomeModal = () => {
  showModal.value = true;
};

defineExpose({
  showWelcomeModal,
});

const isLoginPage = computed(() => window.location.pathname === '/login');

onMounted(() => {
  // Always show on /login testing route, ignoring isInitialSetup value
  if (window.location.pathname === '/login') {
    showModal.value = true;
  }
});

watchEffect(() => {
  /**
   * A necessary workaround for how the webgui handles font-size.
   * There's not a shared CSS file between /login and any of the authenticated webgui pages.
   * Which has lead to font-size differences.
   * The authed webgui pages have CSS of `html { font-size: 62.5%; }` which makes REMs act as if the base font-size is 10px.
   * The /login page doesn't do this.
   * So we'll target the HTML element and toggle the font-size to be 62.5% when the modal is open and 100% when it's closed.
   * */
  const confirmPasswordField = window.document.querySelector('#confirmPassword');

  if (confirmPasswordField) {
    if (showModal.value) {
      window.document.documentElement.style.setProperty('font-size', '62.5%');
    } else {
      window.document.documentElement.style.setProperty('font-size', '100%');
    }
  }
});
</script>

<template>
  <div>
    <!-- Modals teleport target -->
    <div id="modals" class="relative z-99999" />
    
    <Dialog
      v-model="showModal"
      :show-footer="false"
      :show-close-button="isLoginPage"
      size="full"
      class="bg-background"
    >
        <div class="flex flex-col items-center justify-start">
          <div v-if="partnerInfo?.hasPartnerLogo">
            <ActivationPartnerLogo />
          </div>

          <h1 class="text-center text-xl sm:text-2xl font-semibold mt-4">{{ title }}</h1>

          <div class="sm:max-w-xl mx-auto my-12 text-center">
            <p class="text-lg sm:text-xl opacity-75 text-center">{{ description }}</p>
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
