<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSsoProviders } from './useSsoProviders';
import { useSsoAuth } from './useSsoAuth';
import SsoProviderButton from './SsoProviderButton.vue';

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
      <div class="w-full flex flex-col gap-1 my-1">
        <p class="text-center text-gray-500">{{ t('Checking authentication options...') }}</p>
      </div>
    </template>
    
    <template v-else-if="hasProviders">
      <div class="w-full flex flex-col gap-2 my-1">
        <p v-if="showOr" class="text-center">{{ t('or') }}</p>
        <p v-if="showError" class="text-red-500 text-center">{{ error }}</p>
        
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
