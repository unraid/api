<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import SsoProviderButton from '~/components/sso/SsoProviderButton.vue';
import { useSsoAuth } from '~/components/sso/useSsoAuth';
import { useSsoProviders } from '~/components/sso/useSsoProviders';

const emit = defineEmits<{
  'sso-status': [status: { checking: boolean; loading: boolean }];
}>();

const { t } = useI18n();
const { oidcProviders, hasProviders, checkingApi } = useSsoProviders();
const { currentState, error, navigateToProvider } = useSsoAuth();

const showError = computed(() => currentState.value === 'error');
const showOr = computed(() => (currentState.value === 'idle' || showError.value) && hasProviders.value);
const isLoading = computed(() => currentState.value === 'loading');

// Emit status changes
watch(
  [checkingApi, isLoading],
  ([checking, loading]) => {
    emit('sso-status', { checking, loading });
  },
  { immediate: true }
);
</script>

<template>
  <div class="sso-buttons-container">
    <template v-if="checkingApi">
      <div class="my-1 flex w-full flex-col gap-1">
        <p class="text-center text-gray-500">{{ t('sso.ssoButtons.checkingAuthenticationOptions') }}</p>
      </div>
    </template>

    <template v-else-if="hasProviders">
      <div class="my-1 flex w-full flex-col gap-2">
        <p v-if="showOr" class="text-center">{{ t('sso.ssoButtons.or') }}</p>
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
