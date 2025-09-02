<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { BellAlertIcon, ExclamationTriangleIcon, InformationCircleIcon, DocumentTextIcon, ArrowTopRightOnSquareIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/solid';
import { Button, DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@unraid/ui';
import { WEBGUI_TOOLS_DOWNGRADE, WEBGUI_TOOLS_UPDATE, getReleaseNotesUrl } from '~/helpers/urls';

import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import { INFO_VERSIONS_QUERY } from './UserProfile/versions.query';
import ChangelogModal from '~/components/UpdateOs/ChangelogModal.vue';
import { useClipboardWithToast } from '~/composables/useClipboardWithToast';

const { t } = useI18n();
const { copyWithNotification } = useClipboardWithToast();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { partnerInfo } = storeToRefs(useActivationCodeDataStore());
const { osVersion, rebootType, stateDataError } = storeToRefs(serverStore);
const { available, availableWithRenewal } = storeToRefs(updateOsStore);
const { rebootTypeText } = storeToRefs(updateOsActionsStore);

// Query for version information
const { result: versionsResult } = useQuery(INFO_VERSIONS_QUERY, null, {
  fetchPolicy: 'cache-first',
});

// Use versions endpoint as primary source, fallback to store
const displayOsVersion = computed(() => versionsResult.value?.info?.versions?.core?.unraid || osVersion.value || null);
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
    copyWithNotification(displayOsVersion.value, t('OS version copied to clipboard'));
  }
};

const copyApiVersion = () => {
  if (apiVersion.value) {
    copyWithNotification(apiVersion.value, t('API version copied to clipboard'));
  }
};

const unraidLogoHeaderLink = computed<{ href: string; title: string }>(() => {
  if (partnerInfo.value?.partnerUrl) {
    return {
      href: partnerInfo.value.partnerUrl,
      title: t('Visit Partner website'),
    };
  }

  return {
    href: 'https://unraid.net',
    title: t('Visit Unraid website'),
  };
});

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
      href:
        rebootType.value === 'downgrade'
          ? WEBGUI_TOOLS_DOWNGRADE.toString()
          : WEBGUI_TOOLS_UPDATE.toString(),
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
      text: availableWithRenewal.value ? t('Update Released') : t('Update Available'),
      title: availableWithRenewal.value
        ? t('Unraid OS {0} Released', [availableWithRenewal.value])
        : t('Unraid OS {0} Update Available', [available.value]),
    };
  }

  return null;
});
</script>

<template>
  <div class="flex flex-col gap-y-2 mt-6">
    <a
      :href="unraidLogoHeaderLink.href"
      :title="unraidLogoHeaderLink.title"
      target="_blank"
      rel="noopener"
      :aria-label="unraidLogoHeaderLink.title"
    >
      <img
        :src="'/webGui/images/UN-logotype-gradient.svg'"
        class="w-[14rem] xs:w-[16rem] h-auto max-h-[3rem] object-contain"
        alt="Unraid Logo"
      >
    </a>

    <div class="flex flex-wrap justify-start gap-2">
      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <Button 
            variant="link"
            class="text-xs xs:text-sm flex flex-row items-center gap-x-1 font-semibold text-header-text-secondary hover:text-orange-dark focus:text-orange-dark hover:underline focus:underline leading-none h-auto p-0"
            :title="t('Version Information')"
          >
            <InformationCircleIcon 
              class="fill-current w-3 h-3 xs:w-4 xs:h-4 shrink-0" 
            />
            {{ displayOsVersion }}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent class="min-w-[200px]" align="start" :side-offset="4">
          <DropdownMenuLabel>
            {{ t('Version Information') }}
          </DropdownMenuLabel>
          
          <DropdownMenuItem 
            :disabled="!displayOsVersion"
            class="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="copyOsVersion"
          >
            <span class="flex justify-between items-center w-full">
              <span class="flex items-center gap-x-2">
                <span>{{ t('Unraid OS') }}</span>
                <ClipboardDocumentIcon class="w-3 h-3 opacity-60" />
              </span>
              <span class="font-semibold">{{ displayOsVersion || t('Unknown') }}</span>
            </span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            :disabled="!apiVersion"
            class="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="copyApiVersion"
          >
            <span class="flex justify-between items-center w-full">
              <span class="flex items-center gap-x-2">
                <span>{{ t('Unraid API') }}</span>
                <ClipboardDocumentIcon class="w-3 h-3 opacity-60" />
              </span>
              <span class="font-semibold">{{ apiVersion || t('Unknown') }}</span>
            </span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem @click="showOsReleaseNotesModal = true">
            <span class="flex items-center gap-x-2">
              <InformationCircleIcon class="w-4 h-4" />
              {{ t('View OS Release Notes') }}
            </span>
          </DropdownMenuItem>
          
          <DropdownMenuItem @click="openApiChangelog">
            <span class="flex items-center justify-between w-full">
              <span class="flex items-center gap-x-2">
                <DocumentTextIcon class="w-4 h-4" />
                {{ t('View API Changelog') }}
              </span>
              <ArrowTopRightOnSquareIcon class="w-3 h-3 opacity-60" />
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
        <span v-if="updateOsStatus.badge?.icon" class="inline-flex shrink-0 w-4 h-4">
          <component 
            :is="updateOsStatus.badge.icon" 
            class="w-full h-full"
          />
        </span>
        {{ updateOsStatus.text || '' }}
      </Button>
    </div>
    
    <!-- OS Release Notes Modal -->
    <ChangelogModal
      :open="showOsReleaseNotesModal"
      :release="currentVersionRelease"
      view-docs-label="Open in new tab"
      :t="t"
      @close="showOsReleaseNotesModal = false"
    />
  </div>
</template>
