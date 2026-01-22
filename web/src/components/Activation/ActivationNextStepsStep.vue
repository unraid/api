<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

import { ChevronLeftIcon, RocketLaunchIcon } from '@heroicons/vue/24/outline';
import { CheckCircleIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';

export interface Props {
  onComplete: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

interface SectionItem {
  label: string;
  url: string;
  icon?: string;
}

const sections: { title: string; items: SectionItem[] }[] = [
  {
    title: t('activation.nextSteps.doNext'),
    items: [
      {
        label: t('activation.nextSteps.assignDisks'),
        url: 'https://docs.unraid.net/unraid-os/manual/storage-management/#assigning-devices-to-the-array-and-cache',
      },
      {
        label: t('activation.nextSteps.createShare'),
        url: 'https://docs.unraid.net/unraid-os/manual/shares/user-shares/',
      },
      {
        label: t('activation.nextSteps.installApp'),
        url: 'https://docs.unraid.net/unraid-os/manual/applications/community-applications/',
      },
      {
        label: t('activation.nextSteps.setBackups'),
        url: 'https://docs.unraid.net/connect/flash-backup/',
      },
      {
        label: t('activation.nextSteps.notifications'),
        url: 'https://docs.unraid.net/unraid-os/manual/notifications/',
      },
    ],
  },
  {
    title: t('activation.nextSteps.resources'),
    items: [
      {
        label: t('activation.nextSteps.gettingStarted'),
        url: 'https://docs.unraid.net/unraid-os/getting-started/',
      },
      { label: t('activation.nextSteps.communityForum'), url: 'https://forums.unraid.net/' },
      {
        label: t('activation.nextSteps.troubleshooting'),
        url: 'https://docs.unraid.net/unraid-os/troubleshooting/diagnostics-information/',
      },
      { label: t('activation.nextSteps.changeSettings'), url: '/Dashboard' },
    ],
  },
  {
    title: t('activation.nextSteps.contribute'),
    items: [
      {
        label: t('activation.nextSteps.github'),
        url: 'https://github.com/unraid',
        icon: 'i-simple-icons-github',
      },
    ],
  },
  {
    title: t('activation.nextSteps.socials'),
    items: [
      { label: 'Reddit', url: 'https://reddit.com/r/unraid', icon: 'i-simple-icons-reddit' },
      { label: 'Uncast', url: 'https://unraid.net/uncast', icon: 'i-heroicons-microphone' },
      { label: 'Newsletter', url: 'https://unraid.net/newsletter', icon: 'i-heroicons-newspaper' },
    ],
  },
];

const handleComplete = () => {
  props.onComplete();
};

const openLink = (url: string) => {
  if (url.startsWith('/')) {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
    <div class="bg-elevated border-muted rounded-xl border p-6 text-left shadow-sm md:p-10">
      <!-- Header -->
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <RocketLaunchIcon class="text-primary h-8 w-8" />
            <h2 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
              {{ t('activation.nextSteps.title') }}
            </h2>
          </div>
          <p class="text-muted text-lg">
            {{ t('activation.nextSteps.description') }}
          </p>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div v-for="section in sections" :key="section.title" class="space-y-4">
          <h3 class="border-muted text-highlighted border-b pb-2 text-lg font-bold">
            {{ section.title }}
          </h3>
          <ul class="space-y-2">
            <li v-for="item in section.items" :key="item.label">
              <button
                @click="openLink(item.url)"
                class="text-primary hover:text-primary/80 group flex items-center gap-2.5 text-sm font-medium transition-colors hover:underline"
              >
                <UIcon v-if="item.icon" :name="item.icon" class="h-4 w-4 flex-shrink-0" />
                <span
                  v-else
                  class="bg-primary/60 group-hover:bg-primary h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors"
                />
                <span class="text-muted group-hover:text-highlighted text-left transition-colors">{{
                  item.label
                }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="border-muted mt-8 flex flex-col-reverse items-center justify-between gap-6 border-t pt-8 sm:flex-row"
      >
        <button
          v-if="showBack"
          @click="props.onBack"
          class="text-muted hover:text-toned group flex w-full items-center justify-center gap-2 font-medium transition-colors sm:w-auto sm:justify-start"
        >
          <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          {{ t('common.back') }}
        </button>
        <div v-else class="hidden w-1 sm:block" />

        <BrandButton
          :text="t('common.finish')"
          class="!bg-primary hover:!bg-primary/90 w-full min-w-[160px] !text-white shadow-md transition-all hover:shadow-lg sm:w-auto"
          @click="handleComplete"
          :icon-right="CheckCircleIcon"
        />
      </div>
    </div>
  </div>
</template>
