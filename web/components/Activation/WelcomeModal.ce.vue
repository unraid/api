<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { BrandButton, Dialog } from '@unraid/ui';

import ActivationPartnerLogo from '~/components/Activation/ActivationPartnerLogo.vue';
import ActivationSteps from '~/components/Activation/ActivationSteps.vue';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useThemeStore } from '~/store/theme';

const { t } = useI18n();

const { partnerInfo } = storeToRefs(useActivationCodeDataStore());

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
  <div id="modals" ref="modals" class="relative z-[99999]">
    <Dialog
      v-model="showModal"
      :show-footer="false"
      :show-close-button="false"
      size="full"
      class="bg-background"
    >
      <div class="flex flex-col items-center justify-start mt-8">
        <div v-if="partnerInfo?.hasPartnerLogo">
          <ActivationPartnerLogo />
        </div>

        <h1 class="text-center text-20px sm:text-24px font-semibold mt-4">{{ title }}</h1>
        <div class="sm:max-w-lg mx-auto mt-2 text-center">
          <p class="text-18px sm:text-20px opacity-75">
            {{ t(`First, you'll create your device's login credentials, then you'll activate your Unraid license—your device's operating system (OS).`) }}
          </p>
        </div>

        <div class="flex flex-col justify-start p-6 w-2/4">
          <div class="mx-auto mt-6 mb-8">
            <BrandButton :text="t('Create a password')" @click="dropdownHide" />
          </div>

          <ActivationSteps :active-step="1" class="mt-6" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';

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
