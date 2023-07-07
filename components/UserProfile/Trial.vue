<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useTrialStore } from "~/store/trial";

export interface Props {
  open?: boolean;
}

withDefaults(defineProps<Props>(), {
  open: false,
});

const trialStore = useTrialStore();
const { trialStatus } = storeToRefs(trialStore);

const heading = computed(() => {
  if (trialStatus.value === 'failed') return 'Failed to start your free 30 day trial';
  if (trialStatus.value === 'requestNew') return 'Starting your free 30 day trial…';
  if (trialStatus.value === 'success') return 'Free 30 Day Trial Created';
  return '';
});
const subheading = computed(() => {
  /** @todo show response error */
  if (trialStatus.value === 'failed') return 'Key server did not return a trial key. Please try again later.';
  if (trialStatus.value === 'requestNew') return 'Please wait while and keep this window open';
  if (trialStatus.value === 'success') return 'Please wait while the page reloads to install your trial key';
  return '';
});

const close = () => {
  if (trialStatus.value === 'requestNew') return console.debug("[close] not allowed");
  trialStore.setTrialStatus('ready');
};
</script>

<template>
  <Modal
    @close="close"
    :open="open"
    :title="heading"
    :description="subheading"
    :show-close-x="trialStatus !== 'requestNew'"
    max-width="max-w-640px"
  >
    <template #main>
      <BrandLoading v-if="trialStatus === 'requestNew'" class="w-[150px] mx-auto my-24px" />
      <div v-if="trialStatus === 'failed'" class="my-24px">
        <p class="text-red"></p>
      </div>
    </template>

    <template v-if="trialStatus !== 'requestNew'" #footer>
      <div class="w-full max-w-xs flex flex-col items-center gap-y-16px mx-auto">
        <div>
          <button
            @click="close"
            class="text-12px tracking-wide inline-block mx-8px opacity-60 hover:opacity-100 focus:opacity-100 underline transition"
            :title="'Close Modal'"
          >
            {{ "Close" }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>
