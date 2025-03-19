<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { CheckCircleIcon, ExclamationTriangleIcon, UserCircleIcon } from '@heroicons/vue/24/solid';
import { BrandLoading } from '@unraid/ui';

import type { ComposerTranslation } from 'vue-i18n';

import { useServerStore } from '~/store/server';
import { useUnraidApiStore } from '~/store/unraidApi';

const props = defineProps<{ t: ComposerTranslation }>();

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
      text: props.t('Loading…'),
      textClasses: 'italic',
    };
  }
  if (unraidApiStatus.value === 'restarting') {
    return {
      icon: brandLoading,
      iconClasses: 'w-4',
      text: props.t('Restarting unraid-api…'),
      textClasses: 'italic',
    };
  }
  if (unraidApiStatus.value === 'offline') {
    return {
      icon: ExclamationTriangleIcon,
      iconClasses: 'text-red-500 w-16px h-16px',
      text: props.t('unraid-api is offline'),
    };
  }
  if (unraidApiStatus.value === 'online') {
    return {
      icon: CheckCircleIcon,
      iconClasses: 'text-green-600 w-16px h-16px',
      text: props.t('Connected'),
    };
  }
  return undefined;
});
</script>

<template>
  <li v-if="username" class="flex flex-row justify-start items-center gap-8px mt-8px px-8px">
    <UserCircleIcon class="w-16px h-16px" aria-hidden="true" />
    {{ username }}
  </li>
  <li v-if="status" class="flex flex-row justify-start items-center gap-8px mt-8px px-8px">
    <component :is="status.icon" :class="status.iconClasses" aria-hidden="true" />
    {{ status.text }}
  </li>
  <li v-if="unraidApiRestartAction" class="w-full">
    <UpcDropdownItem :item="unraidApiRestartAction" :t="t" />
  </li>
</template>
