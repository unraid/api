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
import { allowedDocsOriginRegex, allowedDocsUrlRegex } from '~/helpers/urls';

import type { ComposerTranslation } from 'vue-i18n';

import RawChangelogRenderer from '~/components/UpdateOs/RawChangelogRenderer.vue';
import { usePurchaseStore } from '~/store/purchase';
import { useThemeStore } from '~/store/theme';
import { useUpdateOsStore } from '~/store/updateOs';

export interface Props {
  open?: boolean;
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const purchaseStore = usePurchaseStore();
const updateOsStore = useUpdateOsStore();
const themeStore = useThemeStore();
const { darkMode } = storeToRefs(themeStore);
const { availableWithRenewal, releaseForUpdate, changelogModalVisible } = storeToRefs(updateOsStore);
const { setReleaseForUpdate, fetchAndConfirmInstall } = updateOsStore;

const showExtendKeyButton = computed(() => {
  return availableWithRenewal.value;
});

// iframe navigation handling
const iframeRef = ref<HTMLIFrameElement | null>(null);
const hasNavigated = ref(false);
const currentIframeUrl = ref<string | null>(null);
const actualIframeSrc = ref<string | null>(null);

const docsChangelogUrl = computed(() => {
  return releaseForUpdate.value?.changelogPretty ?? null;
});

const showRawChangelog = computed<boolean>(() => {
  return !docsChangelogUrl.value && !!releaseForUpdate.value?.changelog;
});

const handleDocsPostMessages = (event: MessageEvent) => {
  // Common checks for all iframe messages
  if (
    event.data &&
    iframeRef.value &&
    event.source === iframeRef.value.contentWindow &&
    (allowedDocsOriginRegex.test(event.origin) || event.origin === 'http://localhost:3000')
  ) {
    // Handle navigation events
    if (event.data.type === 'unraid-docs-navigation') {
      if (typeof event.data.url === 'string' && allowedDocsUrlRegex.test(event.data.url)) {
        hasNavigated.value = event.data.url !== docsChangelogUrl.value;
        currentIframeUrl.value = event.data.url;
      }
    }
    // Handle theme ready events
    else if (event.data.type === 'theme-ready') {
      sendThemeToIframe();
    }
  }
};

// Keep this function just for the watch handler
const sendThemeToIframe = () => {
  if (iframeRef.value && iframeRef.value.contentWindow) {
    try {
      const message = { type: 'theme-update', theme: darkMode.value ? 'dark' : 'light' };
      iframeRef.value.contentWindow.postMessage(message, '*');
    } catch (error) {
      console.error('Failed to send theme to iframe:', error);
    }
  }
};

// Attach event listener right away instead of waiting for mount

onMounted(() => {
  // Set initial values only
  window.addEventListener('message', handleDocsPostMessages);
  currentIframeUrl.value = docsChangelogUrl.value;
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleDocsPostMessages);
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

  if (newUrl) {
    actualIframeSrc.value = newUrl;
  } else {
    actualIframeSrc.value = null;
  }
});

// Only need to watch for theme changes
watch(darkMode, () => {
  // The iframe will only pick up the message if it has sent theme-ready
  sendThemeToIframe();
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
            v-if="actualIframeSrc"
            ref="iframeRef"
            :src="actualIframeSrc"
            class="w-full h-full border-0 rounded-md"
            sandbox="allow-scripts allow-same-origin allow-top-navigation"
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
