<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
// import { storeToRefs } from 'pinia';
// import { useServerStore } from '~/store/server';
// const { stateData } = storeToRefs(useServerStore());

type ApiOnlineStatus = 'online'|'offline';
const onlineStatus = ref<ApiOnlineStatus>('online');
const apiLoading = ref(false);
</script>

<template>
  <li class="mb-8px px-8px flex flex-col items-center">
    <template v-if="apiLoading">
      <BrandLoading class="w-36px mx-auto" :height="21" />
      <span class="text-12px italic opacity-80">{{ 'Loading Connect status…' }}</span>
    </template>
    <span v-else class="w-full flex flex-row justify-start items-center gap-x-8px">
      <ExclamationTriangleIcon v-if="onlineStatus !== 'online'" class="text-red w-16px h-16px" />
      <span v-else class="block w-12px h-12px bg-green rounded-full"></span>
      <span>{{ onlineStatus !== 'online' ? 'Disconnected' : 'Connected' }}</span>
    </span>
  </li>
</template>