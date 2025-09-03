<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { Button } from '@unraid/ui';
import {
  Bars3Icon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/solid';

import BrandAvatar from '~/components/Brand/Avatar.vue';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';

const { t } = useI18n();

const { errors } = storeToRefs(useErrorsStore());
const { connectPluginInstalled, state, stateData } = storeToRefs(useServerStore());

const showErrorIcon = computed(() => errors.value.length || stateData.value.error);

const text = computed((): string => {
  if (stateData.value.error && state.value !== 'EEXPIRED') {
    return t('Fix Error');
  }
  return '';
});

const title = computed((): string => {
  if (state.value === 'ENOKEYFILE') {
    return t('Get Started');
  }
  if (state.value === 'EEXPIRED') {
    return t('Trial Expired, see options below');
  }
  if (showErrorIcon.value) {
    return t('Learn more about the error');
  }
  return t('Open Dropdown');
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

    <Bars3Icon class="w-5" />

    <BrandAvatar v-if="connectPluginInstalled" />
  </Button>
</template>
