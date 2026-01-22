<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

import { BrandButton } from '@unraid/ui';

export interface Props {
  onComplete: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

const sections = [
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
  <div class="mx-auto flex w-full max-w-3xl flex-col items-center space-y-6 pb-4">
    <div class="text-center">
      <h1 class="text-2xl font-semibold">{{ t('activation.nextSteps.title') }}</h1>
      <p class="mt-2 text-sm opacity-75">{{ t('activation.nextSteps.description') }}</p>
    </div>

    <div
      class="grid w-full grid-cols-1 gap-8 rounded-xl border border-gray-100 bg-gray-50 p-6 text-left md:grid-cols-2 dark:border-gray-800 dark:bg-gray-800/30"
    >
      <div v-for="section in sections" :key="section.title" class="space-y-4">
        <h3
          class="border-b border-gray-200 pb-2 text-lg font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100"
        >
          {{ section.title }}
        </h3>
        <ul class="space-y-2.5">
          <li v-for="item in section.items" :key="item.label">
            <button
              @click="openLink(item.url)"
              class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 group flex items-center gap-2 text-sm transition-colors hover:underline"
            >
              <UIcon v-if="item.icon" :name="item.icon" class="h-4 w-4 flex-shrink-0" />
              <span
                v-else
                class="bg-primary-500 h-1.5 w-1.5 flex-shrink-0 rounded-full opacity-60 group-hover:opacity-100"
              />
              <span class="text-left">{{ item.label }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div class="flex space-x-4 pt-6">
      <BrandButton v-if="showBack" :text="t('common.back')" variant="outline" @click="onBack" />
      <BrandButton :text="t('common.finish')" @click="handleComplete" />
    </div>
  </div>
</template>
