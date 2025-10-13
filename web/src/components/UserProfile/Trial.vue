<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { BrandLoading, Button } from '@unraid/ui';

import Modal from '~/components/Modal.vue';
import { useTrialStore } from '~/store/trial';

export interface Props {
  open?: boolean;
}

withDefaults(defineProps<Props>(), {
  open: false,
});
const { t } = useI18n();

const trialStore = useTrialStore();
const { trialModalLoading, trialStatus } = storeToRefs(trialStore);

interface TrialStatusCopy {
  heading: string;
  subheading?: string;
}
const trialStatusCopy = computed((): TrialStatusCopy | null => {
  switch (trialStatus.value) {
    case 'failed':
      return {
        heading: t('userProfile.trial.trialKeyCreationFailed'),
        subheading: t('userProfile.trial.errorCreatiingATrialKeyPlease'),
      };
    case 'trialExtend':
      return {
        heading: t('userProfile.trial.extendingYourFreeTrialByDays'),
        subheading: t('userProfile.trial.pleaseKeepThisWindowOpen'),
      };
    case 'trialStart':
      return {
        heading: t('userProfile.trial.startingYourFreeDayTrial'),
        subheading: t('userProfile.trial.pleaseKeepThisWindowOpen'),
      };
    case 'success':
      return {
        heading: t('userProfile.trial.trialKeyCreated'),
        subheading: t('userProfile.trial.pleaseWaitWhileThePageReloads'),
      };
    case 'ready':
    default:
      return null;
  }
});

const close = () => {
  if (trialStatus.value === 'trialStart') {
    return;
  }
  trialStore.setTrialStatus('ready');
};
</script>

<template>
  <Modal
    :open="open"
    :title="trialStatusCopy?.heading"
    :description="trialStatusCopy?.subheading"
    :show-close-x="!trialModalLoading"
    max-width="max-w-[640px]"
    @close="close"
  >
    <template #main>
      <BrandLoading v-if="trialModalLoading" class="mx-auto my-6 w-[150px]" />
    </template>

    <template v-if="!trialModalLoading" #footer>
      <div class="mx-auto flex w-full max-w-xs flex-col items-center gap-y-4">
        <div>
          <Button
            variant="link"
            class="mx-2 inline-block h-auto p-0 text-xs tracking-wide underline opacity-60 transition hover:opacity-100 focus:opacity-100"
            :title="t('common.closeModal')"
            @click="close"
          >
            {{ t('common.close') }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
