<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useErrorsStore } from '~/store/errors';

const errorsStore = useErrorsStore();
const { errors } = storeToRefs(errorsStore);
</script>

<template>
  <ul v-if="errors.length" class="text-white bg-unraid-red/90 font-semibold list-reset flex flex-col gap-y-8px mb-4px py-12px px-16px rounded">
    <li v-for="(error, index) in errors" :key="index" class="flex flex-col gap-8px">
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
