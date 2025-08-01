<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { BrandLoading } from '@unraid/ui';

import type { ComposerTranslation } from 'vue-i18n';

import { useTrialStore } from '~/store/trial';
import Modal from '~/components/Modal.vue';

export interface Props {
  open?: boolean;
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

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
        heading: props.t('Trial Key Creation Failed'),
        subheading: props.t('Error creatiing a trial key. Please try again later.'),
      };
    case 'trialExtend':
      return {
        heading: props.t('Extending your free trial by 15 days'),
        subheading: props.t('Please keep this window open'),
      };
    case 'trialStart':
      return {
        heading: props.t('Starting your free 30 day trial'),
        subheading: props.t('Please keep this window open'),
      };
    case 'success':
      return {
        heading: props.t('Trial Key Created'),
        subheading: props.t('Please wait while the page reloads to install your trial key'),
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
    :t="t"
    :open="open"
    :title="trialStatusCopy?.heading"
    :description="trialStatusCopy?.subheading"
    :show-close-x="!trialModalLoading"
    max-width="max-w-[640px]"
    @close="close"
  >
    <template #main>
      <BrandLoading v-if="trialModalLoading" class="w-[150px] mx-auto my-6" />
    </template>

    <template v-if="!trialModalLoading" #footer>
      <div class="w-full max-w-xs flex flex-col items-center gap-y-4 mx-auto">
        <div>
          <button
            class="text-xs tracking-wide inline-block mx-2 opacity-60 hover:opacity-100 focus:opacity-100 underline transition"
            :title="t('Close Modal')"
            @click="close"
          >
            {{ t('Close') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>
