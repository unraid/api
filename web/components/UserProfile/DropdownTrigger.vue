<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import {
  Bars3Icon,
  BellAlertIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/solid';

import type { ComposerTranslation } from 'vue-i18n';

import BrandAvatar from '~/components/Brand/Avatar.vue';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

const props = defineProps<{ t: ComposerTranslation }>();

const { errors } = storeToRefs(useErrorsStore());
const { connectPluginInstalled, rebootType, state, stateData } = storeToRefs(useServerStore());
const { available: osUpdateAvailable } = storeToRefs(useUpdateOsStore());

const showErrorIcon = computed(() => errors.value.length || stateData.value.error);

const text = computed((): string => {
  if (stateData.value.error && state.value !== 'EEXPIRED') {
    return props.t('Fix Error');
  }
  return '';
});

const title = computed((): string => {
  if (state.value === 'ENOKEYFILE') {
    return props.t('Get Started');
  }
  if (state.value === 'EEXPIRED') {
    return props.t('Trial Expired, see options below');
  }
  if (showErrorIcon.value) {
    return props.t('Learn more about the error');
  }
  return props.t('Open Dropdown');
});
</script>

<template>
  <button
    class="group text-18px border-0 relative flex flex-row justify-end items-center h-full gap-x-8px opacity-100 hover:opacity-75 transition-opacity text-header-text-primary"
    :title="title"
  >
    <template v-if="errors.length && errors[0].level">
      <InformationCircleIcon
        v-if="errors[0].level === 'info'"
        class="text-unraid-red fill-current relative w-24px h-24px"
      />
      <ExclamationTriangleIcon
        v-if="errors[0].level === 'warning'"
        class="text-unraid-red fill-current relative w-24px h-24px"
      />
      <ShieldExclamationIcon
        v-if="errors[0].level === 'error'"
        class="text-unraid-red fill-current relative w-24px h-24px"
      />
    </template>
    <span v-if="text" class="relative leading-none">
      <span>{{ text }}</span>
      <span
        class="absolute bottom-[-3px] inset-x-0 h-2px w-full bg-linear-to-r from-unraid-red to-orange rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
      />
    </span>

    <BellAlertIcon
      v-if="osUpdateAvailable && !rebootType"
      class="hover:animate-pulse fill-current relative w-16px h-16px"
    />

    <Bars3Icon class="w-20px" />

    <BrandAvatar v-if="connectPluginInstalled" />
  </button>
</template>
