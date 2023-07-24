<script setup lang="ts">
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import { useServerStore } from '~/store/server';

const serverStore = useServerStore();
const { cloud } = storeToRefs(serverStore);
</script>

<template>
  <li class="px-8px flex flex-col items-center">
    <template v-if="!cloud">
      <BrandLoading class="w-36px mx-auto" />
      <span class="text-12px italic opacity-80">{{ 'Loading Connect status…' }}</span>
    </template>
    <span
      v-else
      class="w-full flex flex-row justify-start items-center gap-x-8px"
      :title="!cloud.error ? 'Connect is connected to Unraid cloud services' : cloud.error"
    >
      <CheckCircleIcon v-if="!cloud.error" class="text-green-500 w-16px h-16px" />
      <ExclamationTriangleIcon v-else class="text-red-500 w-16px h-16px" />
      <span>{{ !cloud.error ? 'Connected' : 'Not connected' }}</span>
    </span>
  </li>
</template>
