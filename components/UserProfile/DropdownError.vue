<script setup lang="ts">
// eslint-disable vue/no-v-html
import { storeToRefs } from 'pinia';

import { useErrorsStore } from '~/store/errors';

defineProps<{ t: any; }>();

const errorsStore = useErrorsStore();
const { errors } = storeToRefs(errorsStore);
</script>

<template>
  <ul v-if="errors.length" class="list-reset flex flex-col gap-y-8px mb-4px border-2 border-solid border-unraid-red/90 rounded-md">
    <li v-for="(error, index) in errors" :key="index" class="flex flex-col gap-8px">
      <h3 class="text-18px py-4px px-12px text-white bg-unraid-red/90 font-semibold">
        <span>{{ t(error.heading) }}</span>
      </h3>
      <div class="text-14px px-12px flex flex-col gap-y-8px" :class="{ 'pb-8px': !error.actions }" v-html="t(error.message)" />
      <nav v-if="error.actions">
        <li v-for="(link, idx) in error.actions" :key="`link_${idx}`">
          <UpcDropdownItem :item="link" :rounded="false" :t="t" />
        </li>
      </nav>
    </li>
  </ul>
</template>
