<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ComposerTranslation } from 'vue-i18n';
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton, BrandLoading } from '@unraid/ui';
import Modal from '~/components/Modal.vue';
import { getReleaseNotesUrl } from '~/helpers/urls';

export interface Props {
  open: boolean;
  version: string;
  t: ComposerTranslation;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
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

const openInNewTab = () => {
  window.open(releaseNotesUrl.value, '_blank');
};
</script>

<template>
  <Modal
    :center-content="false"
    max-width="max-w-[800px]"
    :open="open"
    :show-close-x="true"
    :t="t"
    :tall-content="true"
    :title="`Unraid OS ${version} Release Notes`"
    :disable-overlay-close="false"
    @close="handleClose"
  >
    <template #main>
      <div class="flex flex-col gap-4 min-w-[280px] sm:min-w-[400px]">
        <!-- Loading state -->
        <div
          v-if="isLoading"
          class="text-center flex flex-col justify-center w-full min-h-[250px] min-w-[280px] sm:min-w-[400px]"
        >
          <BrandLoading class="w-[150px] mx-auto mt-6" />
          <p>Loading release notes…</p>
        </div>
        
        <!-- iframe for release notes -->
        <div class="w-[calc(100%+3rem)] h-[475px] -mx-6 -my-6">
          <iframe
            ref="iframeRef"
            :src="releaseNotesUrl"
            class="w-full h-full border-0 rounded-md"
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
          @click="openInNewTab"
        >
          Open in New Tab
        </BrandButton>
      </div>
    </template>
  </Modal>
</template>
