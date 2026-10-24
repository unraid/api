<script setup lang="ts">
import { computed } from 'vue';

import { WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import OnboardingModal from '~/components/Onboarding/OnboardingModal.vue';
import UpdateOsChangelogModal from '~/components/UpdateOs/ChangelogModal.vue';
import UpdateOsCheckUpdateResponseModal from '~/components/UpdateOs/CheckUpdateResponseModal.vue';
import UpcCallbackFeedback from '~/components/UserProfile/CallbackFeedback.vue';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

// In standalone mounting context without Suspense, we need to use computed
// to safely access store properties that may be initialized asynchronously
const callbackStore = useCallbackActionsStore();
const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();

const isToolsUpdatePage = computed(
  () => typeof window !== 'undefined' && window.location.pathname === WEBGUI_TOOLS_UPDATE
);
const embeddedUpdateResponseAvailable = computed(
  () => isToolsUpdatePage.value && serverStore.rebootType === ''
);

const callbackStatus = computed(() => callbackStore.callbackStatus);
const updateOsModalVisible = computed(() => updateOsStore.updateOsModalVisible);
const changelogModalVisible = computed(() => updateOsStore.changelogModalVisible);
</script>

<template>
  <div id="modals" ref="modals" class="relative z-[999999]">
    <UpcCallbackFeedback :open="callbackStatus !== 'ready'" />
    <UpdateOsCheckUpdateResponseModal
      v-if="!embeddedUpdateResponseAvailable"
      :open="updateOsModalVisible"
    />
    <UpdateOsChangelogModal v-if="!isToolsUpdatePage" :open="changelogModalVisible" />
    <OnboardingModal />
  </div>
</template>
