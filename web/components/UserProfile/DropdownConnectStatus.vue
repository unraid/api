<script setup lang="ts">
import { h } from 'vue';
import { storeToRefs } from 'pinia';

import { CheckCircleIcon, ExclamationTriangleIcon, UserCircleIcon } from '@heroicons/vue/24/solid';
import { BrandLoading } from '@unraid/ui';

import { useServerStore } from '~/store/server';
import { useUnraidApiStore } from '~/store/unraidApi';
import { useI18n } from '~/composables/useI18n';

const { $t } = useI18n();

const { username } = storeToRefs(useServerStore());

const unraidApiStore = useUnraidApiStore();
const { unraidApiStatus, unraidApiRestartAction } = storeToRefs(unraidApiStore);
const brandLoading = () => h(BrandLoading, { size: 'custom' });

interface StatusOutput {
  icon: typeof BrandLoading | typeof ExclamationTriangleIcon | typeof CheckCircleIcon;
  iconClasses?: string;
  text: string;
  textClasses?: string;
}
const status = computed((): StatusOutput | undefined => {
  if (unraidApiStatus.value === 'connecting') {
    return {
      icon: brandLoading,
      iconClasses: 'w-4',
      text: $t('Loading…'),
      textClasses: 'italic',
    };
  }
  if (unraidApiStatus.value === 'restarting') {
    return {
      icon: brandLoading,
      iconClasses: 'w-4',
      text: $t('Restarting unraid-api…'),
      textClasses: 'italic',
    };
  }
  if (unraidApiStatus.value === 'offline') {
    return {
      icon: ExclamationTriangleIcon,
      iconClasses: 'text-red-500 w-16px h-16px',
      text: $t('unraid-api is offline'),
    };
  }
  if (unraidApiStatus.value === 'online') {
    return {
      icon: CheckCircleIcon,
      iconClasses: 'text-green-600 w-16px h-16px',
      text: $t('Connected'),
    };
  }
  return undefined;
});

const statusItemClasses = "text-14px flex flex-row justify-start items-center gap-8px mt-8px px-8px";
</script>

<template>
  <li v-if="username" :class="statusItemClasses">
    <UserCircleIcon class="w-16px h-16px" aria-hidden="true" />
    {{ username }}
  </li>
  <li v-if="status" :class="statusItemClasses">
    <component :is="status.icon" :class="status.iconClasses" aria-hidden="true" />
    {{ status.text }}
  </li>
  <li v-if="unraidApiRestartAction" class="w-full">
    <UpcDropdownItem :item="unraidApiRestartAction" />
  </li>
</template>
