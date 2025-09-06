<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import {
  Bars3Icon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/solid';
import { Button } from '@unraid/ui';

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
  <Button variant="header" size="header" class="justify-center gap-x-1.5 pl-0" :title="title">
    <template v-if="errors.length && errors[0].level">
      <InformationCircleIcon
        v-if="errors[0].level === 'info'"
        class="text-unraid-red relative h-6 w-6 fill-current"
      />
      <ExclamationTriangleIcon
        v-if="errors[0].level === 'warning'"
        class="text-unraid-red relative h-6 w-6 fill-current"
      />
      <ShieldExclamationIcon
        v-if="errors[0].level === 'error'"
        class="text-unraid-red relative h-6 w-6 fill-current"
      />
    </template>
    <span v-if="text" class="relative leading-none">
      <span>{{ text }}</span>
      <span
        class="from-unraid-red to-orange absolute inset-x-0 bottom-[-3px] h-0.5 w-full rounded bg-linear-to-r opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
      />
    </span>

    <Bars3Icon class="w-5" />

    <BrandAvatar v-if="connectPluginInstalled" />
  </Button>
</template>
