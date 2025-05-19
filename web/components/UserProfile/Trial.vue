<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import { BrandLoading } from '@unraid/ui';

import { useI18n } from '~/composables/useI18n';
import { useTrialStore } from '~/store/trial';

export interface Props {
  open?: boolean;
}

withDefaults(defineProps<Props>(), {
  open: false,
});

const { $t } = useI18n();
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
        heading: $t('Trial Key Creation Failed'),
        subheading: $t('Error creatiing a trial key. Please try again later.'),
      };
    case 'trialExtend':
      return {
        heading: $t('Extending your free trial by 15 days'),
        subheading: $t('Please keep this window open'),
      };
    case 'trialStart':
      return {
        heading: $t('Starting your free 30 day trial'),
        subheading: $t('Please keep this window open'),
      };
    case 'success':
      return {
        heading: $t('Trial Key Created'),
        subheading: $t('Please wait while the page reloads to install your trial key'),
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
    max-width="max-w-640px"
    @close="close"
  >
    <template #main>
      <BrandLoading v-if="trialModalLoading" class="w-[150px] mx-auto my-24px" />
    </template>

    <template v-if="!trialModalLoading" #footer>
      <div class="w-full max-w-xs flex flex-col items-center gap-y-16px mx-auto">
        <div>
          <button
            class="text-12px tracking-wide inline-block mx-8px opacity-60 hover:opacity-100 focus:opacity-100 underline transition"
            :title="$t('Close Modal')"
            @click="close"
          >
            {{ $t('Close') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>
