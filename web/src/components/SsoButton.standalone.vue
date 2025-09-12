<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

import SsoButtons from '~/components/sso/SsoButtons.vue';

const handleSsoStatus = (status: { checking: boolean; loading: boolean }) => {
  // Find the password recovery link on the page
  const passwordRecoveryLink = document.querySelector(
    'a[href*="lost-root-password"]'
  ) as HTMLAnchorElement;

  if (passwordRecoveryLink) {
    // Hide the link when checking API or loading
    if (status.checking || status.loading) {
      passwordRecoveryLink.style.display = 'none';
    } else {
      // Show it again when not checking/loading
      passwordRecoveryLink.style.display = '';
    }
  }
};

// Also hide password recovery initially while checking
onMounted(() => {
  const passwordRecoveryLink = document.querySelector(
    'a[href*="lost-root-password"]'
  ) as HTMLAnchorElement;
  if (passwordRecoveryLink) {
    // Store original display value
    const originalDisplay = passwordRecoveryLink.style.display || '';
    passwordRecoveryLink.dataset.originalDisplay = originalDisplay;
  }
});

// Restore on unmount
onUnmounted(() => {
  const passwordRecoveryLink = document.querySelector(
    'a[href*="lost-root-password"]'
  ) as HTMLAnchorElement;
  if (passwordRecoveryLink && passwordRecoveryLink.dataset.originalDisplay !== undefined) {
    passwordRecoveryLink.style.display = passwordRecoveryLink.dataset.originalDisplay;
  }
});
</script>

<template>
  <SsoButtons @sso-status="handleSsoStatus" />
</template>

<!-- Font size overrides are handled in component-registry.ts for custom elements -->
