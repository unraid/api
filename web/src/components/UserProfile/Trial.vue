<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { BrandLoading, Button } from '@unraid/ui';

import type { ComposerTranslation } from 'vue-i18n';

import Modal from '~/components/Modal.vue';
import { useTrialStore } from '~/store/trial';

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
      <BrandLoading v-if="trialModalLoading" class="mx-auto my-6 w-[150px]" />
    </template>

    <template v-if="!trialModalLoading" #footer>
      <div class="mx-auto flex w-full max-w-xs flex-col items-center gap-y-4">
        <div>
          <Button
            variant="link"
            class="mx-2 inline-block h-auto p-0 text-xs tracking-wide underline opacity-60 transition hover:opacity-100 focus:opacity-100"
            :title="t('Close Modal')"
            @click="close"
          >
            {{ t('Close') }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
