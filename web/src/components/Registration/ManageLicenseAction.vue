<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { BrandButton } from '@unraid/ui';

import { useAccountStore } from '~/store/account';

const { t } = useI18n();
const accountStore = useAccountStore();
</script>

<template>
  <div class="flex flex-col gap-2">
    <BrandButton
      data-testid="manage-license-button"
      :text="t('onboarding.licenseStep.actions.manageLicense')"
      class="w-full sm:max-w-[300px]"
      @click="accountStore.myKeys()"
    />
    <p class="text-sm leading-relaxed opacity-75">
      View replacement and renewal options for this server key in the Unraid Account App.
    </p>
  </div>
</template>
