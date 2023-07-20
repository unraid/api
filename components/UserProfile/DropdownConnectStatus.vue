<script setup lang="ts">
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/vue/24/solid';

type ApiOnlineStatus = 'online'|'offline';
const onlineStatus = ref<ApiOnlineStatus>('online');
const apiLoading = ref(false);

// import { useQuery } from '@vue/apollo-composable';

// import {
//   TEST_FRAGMENT,
//   TEST_QUERY,
// } from './DropdownConnectStatus.fragment';
// import { useFragment } from '@/composables/gql/fragment-masking';

// const { result: newResult } = useQuery(
//   TEST_QUERY,
// );
// const result = computed(() => useFragment(TEST_FRAGMENT, newResult.value?.cloud));

// watch(result, (newVal, oldVal) => {
//   console.log('result', newVal, oldVal);
// });
</script>

<template>
  <li class="px-8px flex flex-col items-center">
    <template v-if="apiLoading">
      <BrandLoading class="w-36px mx-auto" />
      <span class="text-12px italic opacity-80">{{ 'Loading Connect status…' }}</span>
    </template>
    <span
      v-else
      class="w-full flex flex-row justify-start items-center gap-x-8px"
      :title="onlineStatus !== 'online' ? 'Connect is not connected to Unraid cloud services' : 'Connect is connected to Unraid cloud services'"
    >
      <!-- <span class="block w-12px h-12px bg-green-600 rounded-full"></span> -->
      <CheckCircleIcon v-if="onlineStatus === 'online'" class="text-green-500 w-16px h-16px" />
      <ExclamationTriangleIcon v-else class="text-red-500 w-16px h-16px" />
      <span>{{ onlineStatus !== 'online' ? 'Disconnected' : 'Connected' }}</span>
    </span>
  </li>
</template>