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
import {
  BrandButton,
  BrandLoading,
  cn,
  ResponsiveModal,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@unraid/ui';
import { allowedDocsOriginRegex, allowedDocsUrlRegex } from '~/helpers/urls';

import type { ComposerTranslation } from 'vue-i18n';

import RawChangelogRenderer from '~/components/UpdateOs/RawChangelogRenderer.vue';
import { usePurchaseStore } from '~/store/purchase';
import { useThemeStore } from '~/store/theme';
import { useUpdateOsStore } from '~/store/updateOs';

export interface Props {
  open?: boolean;
  t: ComposerTranslation;
  // When provided, uses prop data instead of store data (for viewing release notes)
  release?: {
    version: string;
    name?: string;
    date?: string;
    changelog?: string | null;
    changelogPretty?: string;
    sha256?: string | null;
  } | null;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  release: null,
});

const emit = defineEmits<{
  close: [];
}>();

const purchaseStore = usePurchaseStore();
const updateOsStore = useUpdateOsStore();
const themeStore = useThemeStore();
const { darkMode, theme } = storeToRefs(themeStore);
const isDarkMode = computed(() => {
  if (theme.value.name === 'azure') {
    return true;
  }
  return darkMode.value;
});

const { availableWithRenewal, releaseForUpdate, changelogModalVisible } = storeToRefs(updateOsStore);
const { setReleaseForUpdate, fetchAndConfirmInstall } = updateOsStore;

// Determine if we're in prop mode (viewing specific release) or store mode (update workflow)
const isPropMode = computed(() => !!props.release);

// Use prop data when provided, store data when not
const currentRelease = computed(() => props.release || releaseForUpdate.value);

// Modal visibility: use prop when in prop mode, store visibility when in store mode
const modalVisible = computed(() => (isPropMode.value ? props.open : changelogModalVisible.value));

const showExtendKeyButton = computed(() => {
  return !isPropMode.value && availableWithRenewal.value;
});

// Handle modal closing - emit event in prop mode, clear store in store mode
const handleClose = () => {
  if (isPropMode.value) {
    emit('close');
  } else {
    setReleaseForUpdate(null);
  }
};

// iframe navigation handling
const iframeRef = ref<HTMLIFrameElement | null>(null);
const hasNavigated = ref(false);
const currentIframeUrl = ref<string | null>(null);

const docsChangelogUrl = computed(() => {
  return currentRelease.value?.changelogPretty ?? null;
});

const actualIframeSrc = ref<string | null>(docsChangelogUrl.value);

const showRawChangelog = computed<boolean>(() => {
  return Boolean(!docsChangelogUrl.value && currentRelease.value?.changelog);
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
      const message = { type: 'theme-update', theme: isDarkMode.value ? 'dark' : 'light' };
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

watch(
  docsChangelogUrl,
  (newUrl) => {
    currentIframeUrl.value = newUrl;
    hasNavigated.value = false;

    if (newUrl) {
      actualIframeSrc.value = newUrl;
    } else {
      actualIframeSrc.value = null;
    }
  },
  { immediate: true }
);

// Only need to watch for theme changes
watch(isDarkMode, () => {
  // The iframe will only pick up the message if it has sent theme-ready
  sendThemeToIframe();
});
</script>

<template>
  <ResponsiveModal
    v-if="currentRelease?.version"
    :open="modalVisible"
    sheet-side="bottom"
    sheet-padding="none"
    :dialog-class="'max-w-[80rem] p-0'"
    :show-close-button="true"
    @update:open="(value: boolean) => !value && handleClose()"
  >
    <ResponsiveModalHeader>
      <ResponsiveModalTitle>
        {{ t('Unraid OS {0} Changelog', [currentRelease.version]) }}
      </ResponsiveModalTitle>
    </ResponsiveModalHeader>

    <div class="flex-1 px-3">
      <div class="flex flex-col gap-4 sm:min-w-[40rem]">
        <!-- iframe for changelog if available -->
        <div v-if="docsChangelogUrl" class="h-[calc(100vh-15rem)] w-full overflow-hidden sm:h-[45rem]">
          <iframe
            v-if="actualIframeSrc"
            ref="iframeRef"
            :src="actualIframeSrc"
            class="h-full w-full rounded-md border-0"
            sandbox="allow-scripts allow-same-origin allow-top-navigation"
            title="Unraid Changelog"
          />
        </div>

        <!-- Fallback to raw changelog -->
        <RawChangelogRenderer
          v-else-if="showRawChangelog && currentRelease?.changelog"
          :changelog="currentRelease?.changelog"
          :version="currentRelease?.version"
          :date="currentRelease?.date"
          :t="t"
          :changelog-pretty="currentRelease?.changelogPretty"
        />

        <!-- Loading state -->
        <div
          v-else
          class="flex min-h-[25rem] w-full flex-col justify-center text-center sm:min-w-[40rem]"
        >
          <BrandLoading class="mx-auto mt-6 w-[15rem]" />
          <p>{{ props.t('Loading changelog…') }}</p>
        </div>
      </div>
    </div>

    <ResponsiveModalFooter>
      <div :class="cn('flex w-full flex-wrap justify-between gap-3 md:gap-4')">
        <div :class="cn('flex flex-wrap justify-start gap-3 md:gap-4')">
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
            v-if="currentIframeUrl || currentRelease?.changelogPretty"
            variant="underline"
            :external="true"
            :href="currentIframeUrl || currentRelease?.changelogPretty"
            :icon-right="ArrowTopRightOnSquareIcon"
            aria-label="View on Docs"
          />
        </div>

        <!-- Action buttons (only in store mode for update workflow) -->
        <template v-if="!isPropMode">
          <BrandButton
            v-if="showExtendKeyButton"
            :icon="KeyIcon"
            :icon-right="ArrowTopRightOnSquareIcon"
            @click="purchaseStore.renew()"
          >
            {{ props.t('Extend License to Update') }}
          </BrandButton>
          <BrandButton
            v-else-if="currentRelease?.sha256"
            :icon="ServerStackIcon"
            :icon-right="ArrowRightIcon"
            @click="fetchAndConfirmInstall(currentRelease.sha256)"
          >
            {{ props.t('Continue') }}
          </BrandButton>
        </template>
      </div>
    </ResponsiveModalFooter>
  </ResponsiveModal>
</template>
