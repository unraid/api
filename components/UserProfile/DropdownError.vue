<script setup lang="ts">
import { storeToRefs } from 'pinia';
// import {
//   ExclamationCircleIcon,
//   ExclamationTriangleIcon,
//   ShieldExclamationIcon,
// } from '@heroicons/vue/24/solid';

import { useErrorsStore, type Error } from '~/store/errors';
import { useServerStore } from '~/store/server';

const errorsStore = useErrorsStore();
const { errors } = storeToRefs(errorsStore);
const { stateData } = storeToRefs(useServerStore());

const computedErrors = computed(() => {
  if (stateData.value?.error) {
    return [
      {
        heading: stateData.value.heading,
        level: 'error',
        message: stateData.value.message,
      },
    ];
  };
  return errors.value;
});
</script>

<template>
  <ul v-if="computedErrors" class="text-white bg-unraid-red/90 font-semibold list-reset flex flex-col gap-y-8px mb-4px py-12px px-16px rounded">
    <li v-for="(error, index) in computedErrors" :key="index" class="flex flex-col gap-8px">
      <h3 class="text-18px">
        <span>{{ error.heading }}</span>
      </h3>
      <div v-html="error.message" class="text-14px"></div>
      <nav v-if="error.actions">
        <li v-for="(link, index) in error.actions" :key="`link_${index}`" class="-mx-8px">
          <UpcDropdownItem :item="link" class="text-white" />
        </li>
      </nav>
    </li>
  </ul>
</template>
