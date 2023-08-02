<script setup lang="ts">
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import BrandLoading from '~/components/Brand/Loading.vue';
import { useUnraidApiStore } from '~/store/unraidApi';

const props = defineProps<{ t: any; }>();

const unraidApiStore = useUnraidApiStore();
const { unraidApiStatus, unraidApiRestartAction } = storeToRefs(unraidApiStore);

interface StatusOutput {
  icon: typeof BrandLoading | typeof ExclamationTriangleIcon | typeof CheckCircleIcon;
  iconClasses?: string;
  text: string;
  textClasses?: string;
}
const status = computed((): StatusOutput | undefined => {
  if (unraidApiStatus.value === 'connecting') {
    return {
      icon: BrandLoading,
      iconClasses: 'w-16px',
      text: props.t('Loading…'),
      textClasses: 'italic',
    };
  }
  if (unraidApiStatus.value === 'restarting') {
    return {
      icon: BrandLoading,
      iconClasses: 'w-16px',
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
      iconClasses: 'text-red-600 w-16px h-16px',
      text: props.t('Connected'),
    };
  }
  return undefined;
});
</script>

<template>
  <li
    v-if="status"
    class="flex flex-row justify-start items-center gap-8px mt-8px px-8px"
  >
    <component
      :is="status.icon"
      :class="status.iconClasses"
      aria-hidden="true"
    />
    <span :class="status?.textClasses">
      {{ status.text }}
    </span>
  </li>
  <li v-if="unraidApiRestartAction" class="w-full">
    <UpcDropdownItem :item="unraidApiRestartAction" :t="t" />
  </li>
</template>
