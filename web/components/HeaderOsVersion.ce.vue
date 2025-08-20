<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { BellAlertIcon, ExclamationTriangleIcon, InformationCircleIcon, DocumentTextIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { Badge, DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@unraid/ui';
import { WEBGUI_TOOLS_DOWNGRADE, WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import { INFO_VERSIONS_QUERY } from './UserProfile/versions.query';
import ReleaseNotesModal from '~/components/ReleaseNotesModal.vue';

const { t } = useI18n();

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

const openApiChangelog = () => {
  window.open('https://github.com/unraid/api/releases', '_blank');
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
        class="w-[160px] h-auto max-h-[30px] object-contain"
        alt="Unraid Logo"
      >
    </a>

    <div class="flex flex-wrap justify-start gap-2">
      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button 
            class="text-xs xs:text-sm flex flex-row items-center gap-x-1 font-semibold text-header-text-secondary hover:text-orange-dark focus:text-orange-dark hover:underline focus:underline leading-none"
            :title="t('Version Information')"
          >
            <InformationCircleIcon class="fill-current w-3 h-3 xs:w-4 xs:h-4 shrink-0" />
            {{ displayOsVersion }}
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent class="min-w-[200px]" align="start" :side-offset="4">
          <DropdownMenuLabel>
            {{ t('Version Information') }}
          </DropdownMenuLabel>
          
          <DropdownMenuItem disabled class="text-xs opacity-100">
            <span class="flex justify-between w-full">
              <span>{{ t('Unraid OS') }}</span>
              <span class="font-semibold">{{ displayOsVersion || t('Unknown') }}</span>
            </span>
          </DropdownMenuItem>
          
          <DropdownMenuItem disabled class="text-xs opacity-100">
            <span class="flex justify-between w-full">
              <span>{{ t('Unraid API') }}</span>
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
      <component
        :is="updateOsStatus.href ? 'a' : 'button'"
        v-if="updateOsStatus"
        :href="updateOsStatus.href ?? undefined"
        :title="updateOsStatus.title ?? undefined"
        class="group"
        @click="updateOsStatus.click?.()"
      >
        <Badge
          v-if="updateOsStatus.badge"
          :color="updateOsStatus.badge.color"
          :icon="updateOsStatus.badge.icon"
          size="xs"
        >
          {{ updateOsStatus.text }}
        </Badge>
        <template v-else>
          {{ updateOsStatus.text }}
        </template>
      </component>
    </div>
    
    <!-- OS Release Notes Modal -->
    <ReleaseNotesModal
      v-if="displayOsVersion"
      :open="showOsReleaseNotesModal"
      :version="displayOsVersion"
      :t="t"
      @close="showOsReleaseNotesModal = false"
    />
  </div>
</template>
