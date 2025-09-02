<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { useTrialStore } from '~/store/trial';
import { useUpdateOsStore } from '~/store/updateOs';
import UpcCallbackFeedback from '~/components/UserProfile/CallbackFeedback.vue';
import UpcTrial from '~/components/UserProfile/Trial.vue';
import UpdateOsCheckUpdateResponseModal from '~/components/UpdateOs/CheckUpdateResponseModal.vue';
import UpdateOsChangelogModal from '~/components/UpdateOs/ChangelogModal.vue';
import ActivationModal from '~/components/Activation/ActivationModal.vue';

const { t } = useI18n();

const { callbackStatus } = storeToRefs(useCallbackActionsStore());
const { trialModalVisible } = storeToRefs(useTrialStore());
const { updateOsModalVisible, changelogModalVisible } = storeToRefs(useUpdateOsStore());
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
