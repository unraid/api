<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { Button } from '@unraid/ui';
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
  <Button
    variant="header"
    size="header"
    class="justify-center gap-x-1.5 pl-0"
    :title="title"
  >
    <template v-if="errors.length && errors[0].level">
      <InformationCircleIcon
        v-if="errors[0].level === 'info'"
        class="text-unraid-red fill-current relative w-6 h-6"
      />
      <ExclamationTriangleIcon
        v-if="errors[0].level === 'warning'"
        class="text-unraid-red fill-current relative w-6 h-6"
      />
      <ShieldExclamationIcon
        v-if="errors[0].level === 'error'"
        class="text-unraid-red fill-current relative w-6 h-6"
      />
    </template>
    <span v-if="text" class="relative leading-none">
      <span>{{ text }}</span>
      <span
        class="absolute bottom-[-3px] inset-x-0 h-0.5 w-full bg-linear-to-r from-unraid-red to-orange rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
      />
    </span>

    <BellAlertIcon
      v-if="osUpdateAvailable && !rebootType"
      class="hover:animate-pulse fill-current relative w-4 h-4"
    />

    <Bars3Icon class="w-5" />

    <BrandAvatar v-if="connectPluginInstalled" />
  </Button>
</template>
