<script setup lang="ts">
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/vue/24/solid';
import { provideApolloClient, useQuery } from '@vue/apollo-composable';

import { ONLINE_QUERY } from './DropdownConnectStatus.fragment';
import { useUnraidApiStore } from '~/store/unraidApi';

const unraidApiStore = useUnraidApiStore();

const { loading, result } = provideApolloClient(unraidApiStore.unraidApiClient)(() => useQuery(ONLINE_QUERY));
const online = computed(() => result.value ?? null);

watch(online, (newVal, oldVal) => {
  console.log('[watch:online]', newVal, oldVal);
});
</script>

<template>
  <li class="px-8px flex flex-col items-center">
    <template v-if="loading">
      <BrandLoading class="w-36px mx-auto" />
      <span class="text-12px italic opacity-80">{{ 'Loading Connect status…' }}</span>
    </template>
    <span
      v-else
      class="w-full flex flex-row justify-start items-center gap-x-8px"
      :title="online ? 'Connect is connected to Unraid cloud services' : 'Connect is not connected to Unraid cloud services'"
    >
      <!-- <span class="block w-12px h-12px bg-green-600 rounded-full"></span> -->
      <CheckCircleIcon v-if="online" class="text-green-500 w-16px h-16px" />
      <ExclamationTriangleIcon v-else class="text-red-500 w-16px h-16px" />
      <span>{{ online ? 'Connected' : 'Disconnected' }}</span>
    </span>
  </li>
</template>
