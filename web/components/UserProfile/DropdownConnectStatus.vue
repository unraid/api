<script setup lang="ts">
import { computed, h } from 'vue';
import { storeToRefs } from 'pinia';

import { CheckCircleIcon, ExclamationTriangleIcon, UserCircleIcon } from '@heroicons/vue/24/solid';
import { BrandLoading } from '@unraid/ui';

import type { ComposerTranslation } from 'vue-i18n';

import { useServerStore } from '~/store/server';
import { useUnraidApiStore } from '~/store/unraidApi';
import UpcDropdownItem from './DropdownItem.vue';

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
      iconClasses: 'text-red-500 w-4 h-4',
      text: props.t('unraid-api is offline'),
    };
  }
  if (unraidApiStatus.value === 'online') {
    return {
      icon: CheckCircleIcon,
      iconClasses: 'text-green-600 w-4 h-4',
      text: props.t('Connected'),
    };
  }
  return undefined;
});

const statusItemClasses = "text-sm flex flex-row justify-start items-center gap-2 mt-2 px-2";
</script>

<template>
  <li v-if="username" :class="statusItemClasses">
    <UserCircleIcon class="w-4 h-4" aria-hidden="true" />
    {{ username }}
  </li>
  <li v-if="status" :class="statusItemClasses">
    <component :is="status.icon" :class="status.iconClasses" aria-hidden="true" />
    {{ status.text }}
  </li>
  <li v-if="unraidApiRestartAction" class="w-full">
    <UpcDropdownItem :item="unraidApiRestartAction" :t="t" />
  </li>
</template>
