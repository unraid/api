<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import ActivationModal from '~/components/Activation/ActivationModal.vue';
import UpdateOsChangelogModal from '~/components/UpdateOs/ChangelogModal.vue';
import UpdateOsCheckUpdateResponseModal from '~/components/UpdateOs/CheckUpdateResponseModal.vue';
import UpcCallbackFeedback from '~/components/UserProfile/CallbackFeedback.vue';
import UpcTrial from '~/components/UserProfile/Trial.vue';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useTrialStore } from '~/store/trial';
import { useUpdateOsStore } from '~/store/updateOs';

const { t } = useI18n();

// In standalone mounting context without Suspense, we need to use computed
// to safely access store properties that may be initialized asynchronously
const callbackStore = useCallbackActionsStore();
const trialStore = useTrialStore();
const updateOsStore = useUpdateOsStore();

const callbackStatus = computed(() => callbackStore.callbackStatus);
const trialModalVisible = computed(() => trialStore.trialModalVisible);
const updateOsModalVisible = computed(() => updateOsStore.updateOsModalVisible);
const changelogModalVisible = computed(() => updateOsStore.changelogModalVisible);
</script>

<template>
  <div id="modals" ref="modals" class="relative z-99999">
    <UpcCallbackFeedback :t="t" :open="callbackStatus !== 'ready'" />
    <UpcTrial :t="t" :open="trialModalVisible" />
    <UpdateOsCheckUpdateResponseModal :t="t" :open="updateOsModalVisible" />
    <UpdateOsChangelogModal :t="t" :open="changelogModalVisible" />
    <ActivationModal :t="t" />
  </div>
</template>
