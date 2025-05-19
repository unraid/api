<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  KeyIcon,
  ServerStackIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton, BrandLoading } from '@unraid/ui';

import type { ComposerTranslation } from 'vue-i18n';

import RawChangelogRenderer from '~/components/UpdateOs/RawChangelogRenderer.vue';
import { usePurchaseStore } from '~/store/purchase';
import { useUpdateOsStore } from '~/store/updateOs';
import { allowedDocsOriginRegex, allowedDocsUrlRegex } from '~/helpers/urls';

export interface Props {
  open?: boolean;
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const purchaseStore = usePurchaseStore();
const updateOsStore = useUpdateOsStore();
const { availableWithRenewal, releaseForUpdate, changelogModalVisible } = storeToRefs(updateOsStore);
const { setReleaseForUpdate, fetchAndConfirmInstall } = updateOsStore;

const showExtendKeyButton = computed(() => {
  return availableWithRenewal.value;
});

// iframe navigation handling
const iframeRef = ref<HTMLIFrameElement | null>(null);
const hasNavigated = ref(false);
const currentIframeUrl = ref<string | null>(null);

const docsChangelogUrl = computed(() => {
  return releaseForUpdate.value?.changelogPretty ?? null;
});

const showRawChangelog = computed<boolean>(() => {
  return !docsChangelogUrl.value && !!releaseForUpdate.value?.changelog;
});

const handleIframeNavigationMessage = (event: MessageEvent) => {
  if (
    event.data &&
    event.data.type === 'unraid-docs-navigation' &&
    iframeRef.value &&
    event.source === iframeRef.value.contentWindow &&
    allowedDocsOriginRegex.test(event.origin)
  ) {
    if (
      typeof event.data.url === 'string' &&
      allowedDocsUrlRegex.test(event.data.url)
    ) {
      if (event.data.url !== docsChangelogUrl.value) {
        hasNavigated.value = true;
      } else {
        hasNavigated.value = false;
      }
      currentIframeUrl.value = event.data.url;
    }
  }
};

onMounted(() => {
  window.addEventListener('message', handleIframeNavigationMessage);
  // Set initial value
  currentIframeUrl.value = docsChangelogUrl.value;
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleIframeNavigationMessage);
});

const revertToInitialChangelog = () => {
  if (iframeRef.value && docsChangelogUrl.value) {
    iframeRef.value.src = docsChangelogUrl.value;
    hasNavigated.value = false;
    currentIframeUrl.value = docsChangelogUrl.value;
  }
};

watch(docsChangelogUrl, (newUrl) => {
  currentIframeUrl.value = newUrl;
  hasNavigated.value = false;
});
</script>

<template>
  <Modal
    v-if="releaseForUpdate?.version"
    :center-content="false"
    max-width="max-w-800px"
    :open="changelogModalVisible"
    :show-close-x="true"
    :t="t"
    :tall-content="true"
    :title="t('Unraid OS {0} Changelog', [releaseForUpdate.version])"
    :disable-overlay-close="false"
    @close="setReleaseForUpdate(null)"
  >
    <template #main>
      <div class="flex flex-col gap-4 min-w-[280px] sm:min-w-[400px]">
        <!-- iframe for changelog if available -->
        <div v-if="docsChangelogUrl" class="w-[calc(100%+3rem)] h-[475px] -mx-6 -my-6">
          <iframe
            ref="iframeRef"
            :src="docsChangelogUrl"
            class="w-full h-full border-0 rounded-md"
            sandbox="allow-scripts allow-same-origin"
            title="Unraid Changelog"
          ></iframe>
        </div>

        <!-- Fallback to raw changelog -->
        <RawChangelogRenderer
          v-else-if="showRawChangelog && releaseForUpdate?.changelog"
          :changelog="releaseForUpdate?.changelog"
          :version="releaseForUpdate?.version"
          :date="releaseForUpdate?.date"
          :t="t"
          :changelog-pretty="releaseForUpdate?.changelogPretty"
        />

        <!-- Loading state -->
        <div
          v-else
          class="text-center flex flex-col justify-center w-full min-h-[250px] min-w-[280px] sm:min-w-[400px]"
        >
          <BrandLoading class="w-[150px] mx-auto mt-24px" />
          <p>{{ props.t('Loading changelog…') }}</p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-col-reverse xs:flex-row justify-between gap-12px md:gap-16px">
        <div class="flex flex-col-reverse xs:flex-row xs:justify-start gap-12px md:gap-16px">
          <!-- Back to changelog button (when navigated away) -->
          <BrandButton
            v-if="hasNavigated && docsChangelogUrl"
            variant="underline"
            :icon="ArrowLeftIcon"
            aria-label="Back to Changelog"
            @click="revertToInitialChangelog"
          />

          <!-- View on docs button -->
          <BrandButton
            v-if="currentIframeUrl || releaseForUpdate?.changelogPretty"
            variant="underline"
            :external="true"
            :href="currentIframeUrl || releaseForUpdate?.changelogPretty"
            :icon="ArrowTopRightOnSquareIcon"
            aria-label="View on Docs"
          />
        </div>

        <!-- Action buttons -->
        <BrandButton
          v-if="showExtendKeyButton"
          variant="fill"
          :icon="KeyIcon"
          :icon-right="ArrowTopRightOnSquareIcon"
          @click="purchaseStore.renew()"
        >
          {{ props.t('Extend License to Update') }}
        </BrandButton>
        <BrandButton
          v-else-if="releaseForUpdate?.sha256"
          :icon="ServerStackIcon"
          :icon-right="ArrowRightIcon"
          @click="fetchAndConfirmInstall(releaseForUpdate.sha256)"
        >
          {{ props.t('Continue') }}
        </BrandButton>
      </div>
    </template>
  </Modal>
</template>
