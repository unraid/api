<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import SsoProviderButton from '~/components/sso/SsoProviderButton.vue';
import { useSsoAuth } from '~/components/sso/useSsoAuth';
import { useSsoProviders } from '~/components/sso/useSsoProviders';

const { t } = useI18n();
const { oidcProviders, hasProviders, checkingApi } = useSsoProviders();
const { currentState, error, navigateToProvider } = useSsoAuth();

const showError = computed(() => currentState.value === 'error');
const showOr = computed(() => (currentState.value === 'idle' || showError.value) && hasProviders.value);
const isLoading = computed(() => currentState.value === 'loading');
</script>

<template>
  <div class="sso-buttons-container">
    <template v-if="checkingApi">
      <div class="my-1 flex w-full flex-col gap-1">
        <p class="text-center text-gray-500">{{ t('Checking authentication options...') }}</p>
      </div>
    </template>

    <template v-else-if="hasProviders">
      <div class="my-1 flex w-full flex-col gap-2">
        <p v-if="showOr" class="text-center">{{ t('or') }}</p>
        <p v-if="showError" class="text-center text-red-500">{{ error }}</p>

        <!-- All OIDC Providers -->
        <SsoProviderButton
          v-for="provider in oidcProviders"
          :key="provider.id"
          :provider="provider"
          :disabled="isLoading"
          :on-click="navigateToProvider"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Component-specific styles if needed */
</style>
