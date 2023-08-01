<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useTrialStore } from '~/store/trial';

export interface Props {
  open?: boolean;
  t: any;
}

withDefaults(defineProps<Props>(), {
  open: false,
});

const trialStore = useTrialStore();
const { trialModalLoading, trialStatus, trialStatusCopy } = storeToRefs(trialStore);

const close = () => {
  if (trialStatus.value === 'trialStart') { return console.debug('[close] not allowed'); }
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
