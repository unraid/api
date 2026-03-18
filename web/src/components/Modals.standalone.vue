<script setup lang="ts">
import { computed } from 'vue';

import OnboardingModal from '~/components/Onboarding/OnboardingModal.vue';
import UpdateOsChangelogModal from '~/components/UpdateOs/ChangelogModal.vue';
import UpdateOsCheckUpdateResponseModal from '~/components/UpdateOs/CheckUpdateResponseModal.vue';
import UpcCallbackFeedback from '~/components/UserProfile/CallbackFeedback.vue';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useUpdateOsStore } from '~/store/updateOs';

// In standalone mounting context without Suspense, we need to use computed
// to safely access store properties that may be initialized asynchronously
const callbackStore = useCallbackActionsStore();
const updateOsStore = useUpdateOsStore();

const callbackStatus = computed(() => callbackStore.callbackStatus);
const updateOsModalVisible = computed(() => updateOsStore.updateOsModalVisible);
const changelogModalVisible = computed(() => updateOsStore.changelogModalVisible);
</script>

<template>
  <div id="modals" ref="modals" class="relative z-[999999]">
    <UpcCallbackFeedback :open="callbackStatus !== 'ready'" />
    <UpdateOsCheckUpdateResponseModal :open="updateOsModalVisible" />
    <UpdateOsChangelogModal :open="changelogModalVisible" />
    <OnboardingModal />
  </div>
</template>
