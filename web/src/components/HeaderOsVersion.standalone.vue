<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useLazyQuery } from '@vue/apollo-composable';

import {
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/solid';
import {
  Button,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@unraid/ui';
import { getReleaseNotesUrl, WEBGUI_TOOLS_DOWNGRADE, WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import ChangelogModal from '~/components/UpdateOs/ChangelogModal.vue';
import { INFO_VERSIONS_QUERY } from '~/components/UserProfile/versions.query';
import { useClipboardWithToast } from '~/composables/useClipboardWithToast';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

const { t } = useI18n();
const { copyWithNotification } = useClipboardWithToast();

// Defer logo cleanup to avoid blocking mount
onMounted(() => {
  nextTick(() => {
    const logoWrapper = document.querySelector('.logo');
    logoWrapper?.classList.remove('logo');
  });
});

// Initialize all stores - they're needed for the UI
const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { osVersion, rebootType, stateDataError } = storeToRefs(serverStore);
const { available, availableWithRenewal } = storeToRefs(updateOsStore);
const { rebootTypeText } = storeToRefs(updateOsActionsStore);

// Use lazy query and only load when dropdown is opened
const { load: loadVersions, result: versionsResult } = useLazyQuery(INFO_VERSIONS_QUERY);

// Track if we've loaded the versions yet
const hasLoadedVersions = ref(false);

// Load version data only when dropdown is opened
const handleDropdownOpen = (open: boolean) => {
  if (open && !hasLoadedVersions.value) {
    hasLoadedVersions.value = true;
    loadVersions();
  }
};

// Use versions endpoint as primary source, fallback to store
const displayOsVersion = computed(
  () => versionsResult.value?.info?.versions?.core?.unraid || osVersion.value || null
);
const apiVersion = computed(() => versionsResult.value?.info?.versions?.core?.api || null);
const showOsReleaseNotesModal = ref(false);

// Create release object for current version to pass to ChangelogModal
const currentVersionRelease = computed(() => {
  if (!displayOsVersion.value) return null;

  const version = displayOsVersion.value;
  const releaseNotesUrl = getReleaseNotesUrl(version).toString();

  return {
    version,
    name: `Unraid ${version}`,
    date: undefined, // We don't know the release date for current version
    changelog: null, // No raw changelog for current version
    changelogPretty: releaseNotesUrl,
    sha256: null, // No update functionality for current version
  };
});

const openApiChangelog = () => {
  window.open('https://github.com/unraid/api/releases', '_blank');
};

const copyOsVersion = () => {
  if (displayOsVersion.value) {
    copyWithNotification(displayOsVersion.value, t('headerOsVersion.osVersionCopiedToClipboard'));
  }
};

const copyApiVersion = () => {
  if (apiVersion.value) {
    copyWithNotification(apiVersion.value, t('headerOsVersion.apiVersionCopiedToClipboard'));
  }
};

const unraidLogoHeaderLink = computed<{ href: string; title: string }>(() => ({
  href: 'https://unraid.net',
  title: t('headerOsVersion.visitUnraidWebsite'),
}));

const handleUpdateStatusClick = () => {
  if (!updateOsStatus.value) return;

  if (updateOsStatus.value.click) {
    updateOsStatus.value.click();
  } else if (updateOsStatus.value.href) {
    window.location.href = updateOsStatus.value.href;
  }
};

const updateOsStatus = computed(() => {
  if (stateDataError.value) {
    // only allowed to update when server is does not have a state error
    return null;
  }

  if (rebootTypeText.value) {
    return {
      badge: {
        color: 'yellow',
        icon: ExclamationTriangleIcon,
      },
      href: rebootType.value === 'downgrade' ? WEBGUI_TOOLS_DOWNGRADE : WEBGUI_TOOLS_UPDATE,
      text: t(rebootTypeText.value),
    };
  }

  if (availableWithRenewal.value || available.value) {
    return {
      badge: {
        color: 'orange',
        icon: BellAlertIcon,
      },
      click: () => {
        updateOsStore.setModalOpen(true);
      },
      text: availableWithRenewal.value
        ? t('headerOsVersion.updateReleased')
        : t('headerOsVersion.updateAvailable2'),
      title: availableWithRenewal.value
        ? t('headerOsVersion.unraidOsReleased', [availableWithRenewal.value])
        : t('headerOsVersion.unraidOsUpdateAvailable', [available.value]),
    };
  }

  return null;
});
</script>

<template>
  <div class="mt-4 ml-4 flex max-w-fit flex-col gap-y-2">
    <a
      :href="unraidLogoHeaderLink.href"
      :title="unraidLogoHeaderLink.title"
      target="_blank"
      rel="noopener"
      :aria-label="unraidLogoHeaderLink.title"
    >
      <img
        :src="'/webGui/images/UN-logotype-gradient.svg'"
        class="xs:w-[16rem] h-auto max-h-[3rem] w-[14rem] object-contain"
        alt="Unraid Logo"
      />
    </a>

    <div class="mt-2 flex flex-wrap justify-start gap-2">
      <DropdownMenuRoot @update:open="handleDropdownOpen">
        <DropdownMenuTrigger as-child>
          <Button
            variant="link"
            class="xs:text-sm text-header-text-secondary hover:text-orange-dark focus:text-orange-dark flex h-auto flex-row items-center gap-x-1 p-0 text-xs leading-none font-semibold hover:underline focus:underline"
            :title="t('headerOsVersion.versionInformation')"
          >
            <InformationCircleIcon :style="{ width: '12px', height: '12px', flexShrink: 0 }" />
            {{ displayOsVersion }}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent class="min-w-[200px]" align="start" :side-offset="4">
          <DropdownMenuLabel>
            {{ t('headerOsVersion.versionInformation') }}
          </DropdownMenuLabel>

          <DropdownMenuItem
            :disabled="!displayOsVersion"
            class="cursor-pointer text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="copyOsVersion"
          >
            <span class="flex w-full items-center justify-between">
              <span class="flex items-center gap-x-2">
                <span>{{ t('headerOsVersion.unraidOs') }}</span>
                <ClipboardDocumentIcon class="h-3 w-3 opacity-60" />
              </span>
              <span class="font-semibold">{{ displayOsVersion || t('common.unknown') }}</span>
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            :disabled="!apiVersion"
            class="cursor-pointer text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="copyApiVersion"
          >
            <span class="flex w-full items-center justify-between">
              <span class="flex items-center gap-x-2">
                <span>{{ t('headerOsVersion.unraidApi') }}</span>
                <ClipboardDocumentIcon class="h-3 w-3 opacity-60" />
              </span>
              <span class="font-semibold">{{ apiVersion || t('common.unknown') }}</span>
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem @click="showOsReleaseNotesModal = true">
            <span class="flex items-center gap-x-2">
              <InformationCircleIcon class="h-4 w-4" />
              {{ t('headerOsVersion.viewOsReleaseNotes') }}
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem @click="openApiChangelog">
            <span class="flex w-full items-center justify-between">
              <span class="flex items-center gap-x-2">
                <DocumentTextIcon class="h-4 w-4" />
                {{ t('headerOsVersion.viewApiChangelog') }}
              </span>
              <ArrowTopRightOnSquareIcon class="h-3 w-3 opacity-60" />
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
      <Button
        v-if="updateOsStatus"
        :variant="updateOsStatus.badge?.color === 'orange' ? 'pill-orange' : 'pill-gray'"
        :title="updateOsStatus.title ?? updateOsStatus.text"
        :disabled="!updateOsStatus.href && !updateOsStatus.click"
        size="sm"
        @click="handleUpdateStatusClick"
      >
        <span v-if="updateOsStatus.badge?.icon" class="inline-flex h-4 w-4 shrink-0">
          <component :is="updateOsStatus.badge.icon" class="h-full w-full" />
        </span>
        {{ updateOsStatus.text || '' }}
      </Button>
    </div>

    <!-- OS Release Notes Modal -->
    <ChangelogModal
      :open="showOsReleaseNotesModal"
      :release="currentVersionRelease"
      view-docs-label="Open in new tab"
      @close="showOsReleaseNotesModal = false"
    />
  </div>
</template>
