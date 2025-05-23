<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { useTrialStore } from '~/store/trial';
import { useUpdateOsStore } from '~/store/updateOs';

const { t } = useI18n();

const { callbackStatus } = storeToRefs(useCallbackActionsStore());
const { trialModalVisible } = storeToRefs(useTrialStore());
const { updateOsModalVisible, changelogModalVisible } = storeToRefs(useUpdateOsStore());
</script>

<template>
  <div id="modals" ref="modals" class="relative z-[99999]">
    <UpcCallbackFeedback :t="t" :open="callbackStatus !== 'ready'" />
    <UpcTrial :t="t" :open="trialModalVisible" />
    <UpdateOsCheckUpdateResponseModal :t="t" :open="updateOsModalVisible" />
    <UpdateOsChangelogModal :t="t" :open="changelogModalVisible" />
    <ActivationModal :t="t" />
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
