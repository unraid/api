<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useErrorsStore } from '~/store/errors';

const errorsStore = useErrorsStore();
const { errors } = storeToRefs(errorsStore);
</script>

<template>
  <ul v-if="errors.length" class="list-reset flex flex-col gap-y-8px mb-4px border-2 border-solid border-unraid-red/90 rounded-md">
    <li v-for="(error, index) in errors" :key="index" class="flex flex-col gap-8px">
      <h3 class="text-18px py-8px px-16px text-white bg-unraid-red/90 font-semibold text-center">
        <span>{{ error.heading }}</span>
      </h3>
      <div v-html="error.message" class="text-14px pt-8px px-12px"></div>
      <nav v-if="error.actions">
        <li v-for="(link, index) in error.actions" :key="`link_${index}`">
          <UpcDropdownItem :item="link" :rounded="false" />
        </li>
      </nav>
    </li>
  </ul>
</template>
