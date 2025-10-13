<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import {
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
import { DOCS } from '~/helpers/urls';

import RawChangelogRenderer from '~/components/UpdateOs/RawChangelogRenderer.vue';
import { usePurchaseStore } from '~/store/purchase';
import { useThemeStore } from '~/store/theme';
import { useUpdateOsStore } from '~/store/updateOs';

export interface Props {
  open?: boolean;
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
const { t } = useI18n();

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
const docsChangelogUrl = computed(() => {
  return currentRelease.value?.changelogPretty ?? null;
});

const iframeSrc = computed(() => {
  if (!docsChangelogUrl.value) {
    return null;
  }

  try {
    const entryTarget = docsChangelogUrl.value.trim();
    if (!entryTarget) {
      return null;
    }

    let entryUrl: URL;

    try {
      entryUrl = new URL(entryTarget);
      const protocol = entryUrl.protocol.toLowerCase();
      if (protocol !== 'http:' && protocol !== 'https:') {
        return null;
      }
      if (entryUrl.origin !== DOCS.origin) {
        return null;
      }
    } catch (error) {
      entryUrl = new URL(entryTarget, DOCS);
      if (entryUrl.origin !== DOCS.origin) {
        return null;
      }
    }

    const entryValue = `${entryUrl.pathname}${entryUrl.search}${entryUrl.hash}`;
    const url = new URL(entryValue, DOCS);

    url.searchParams.set('embed', '1');
    url.searchParams.set('theme', isDarkMode.value ? 'dark' : 'light');
    url.searchParams.set('entry', entryValue);

    return url.toString();
  } catch (error) {
    console.error('Failed to construct docs iframe URL:', error);
    return null;
  }
});

const showRawChangelog = computed<boolean>(() => {
  return Boolean(!iframeSrc.value && currentRelease.value?.changelog);
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
        {{ t('updateOs.changelogModal.unraidOsChangelog', [currentRelease.version]) }}
      </ResponsiveModalTitle>
    </ResponsiveModalHeader>

    <div class="flex-1 px-3">
      <div class="flex flex-col gap-4 sm:min-w-[40rem]">
        <!-- iframe for changelog if available -->
        <div v-if="iframeSrc" class="h-[calc(100vh-15rem)] w-full overflow-hidden sm:h-[45rem]">
          <iframe
            :src="iframeSrc"
            class="h-full w-full rounded-md border-0"
            sandbox="allow-scripts allow-same-origin"
            allow="fullscreen"
            referrerpolicy="no-referrer"
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
          <p>{{ t('updateOs.changelogModal.loadingChangelog') }}</p>
        </div>
      </div>
    </div>

    <ResponsiveModalFooter>
      <div :class="cn('flex w-full flex-wrap justify-between gap-3 md:gap-4')">
        <div :class="cn('flex flex-wrap justify-start gap-3 md:gap-4')">
          <!-- View on docs button -->
          <BrandButton
            v-if="docsChangelogUrl"
            variant="underline"
            :external="true"
            :href="docsChangelogUrl"
            :icon-right="ArrowTopRightOnSquareIcon"
            aria-label="View on Docs"
            target="_blank"
            rel="noopener"
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
            {{ t('updateOs.changelogModal.extendLicenseToUpdate') }}
          </BrandButton>
          <BrandButton
            v-else-if="currentRelease?.sha256"
            :icon="ServerStackIcon"
            :icon-right="ArrowRightIcon"
            @click="fetchAndConfirmInstall(currentRelease.sha256)"
          >
            {{ t('common.continue') }}
          </BrandButton>
        </template>
      </div>
    </ResponsiveModalFooter>
  </ResponsiveModal>
</template>
