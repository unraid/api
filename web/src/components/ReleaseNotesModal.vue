<script setup lang="ts">
import { computed, ref } from 'vue';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton, BrandLoading } from '@unraid/ui';
import { getReleaseNotesUrl } from '~/helpers/urls';

import Modal from '~/components/Modal.vue';

export interface Props {
  open: boolean;
  version: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const _iframeRef = ref<HTMLIFrameElement | null>(null);
const isLoading = ref(true);

const releaseNotesUrl = computed(() => {
  return getReleaseNotesUrl(props.version).toString();
});

const handleIframeLoad = () => {
  isLoading.value = false;
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <Modal
    :center-content="false"
    max-width="max-w-6xl"
    :open="open"
    :show-close-x="true"
    :tall-content="true"
    :title="`Unraid OS ${version} Release Notes`"
    :disable-overlay-close="false"
    @close="handleClose"
  >
    <template #main>
      <div class="flex min-w-[280px] flex-col gap-4 sm:min-w-[400px]">
        <!-- Loading state -->
        <div
          v-if="isLoading"
          class="flex min-h-[250px] w-full min-w-[280px] flex-col justify-center text-center sm:min-w-[400px]"
        >
          <BrandLoading class="mx-auto mt-6 w-[150px]" />
          <p>Loading release notes…</p>
        </div>

        <!-- iframe for release notes -->
        <div class="-mx-6 -my-6 h-[75vh] max-h-[800px] w-[calc(100%+3rem)]">
          <iframe
            ref="_iframeRef"
            :src="releaseNotesUrl"
            class="h-full w-full rounded-md border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Unraid Release Notes"
            @load="handleIframeLoad"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <!-- View on docs button -->
        <BrandButton
          variant="underline"
          :external="true"
          :href="releaseNotesUrl"
          :icon="ArrowTopRightOnSquareIcon"
          aria-label="View on Docs"
        >
          Open in New Tab
        </BrandButton>
      </div>
    </template>
  </Modal>
</template>
