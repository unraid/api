<script setup lang="ts">
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

// import { useServerStore } from '~/store/server';
import { useUnraidApiStore } from '~/store/unraidApi';

// const serverStore = useServerStore();
// const { cloud } = storeToRefs(serverStore);
const unraidApiStore = useUnraidApiStore();
const { unraidApiStatus, unraidApiRestartAction } = storeToRefs(unraidApiStore);
</script>

<template>
  <li class="px-8px flex flex-col items-center">
    <template v-if="unraidApiStatus === 'connecting' || unraidApiStatus === 'restarting'">
      <BrandLoading class="w-36px mx-auto" />
      <span class="text-12px italic opacity-80">{{ unraidApiStatus === 'connecting' ? 'Loading Connect…' : 'Restarting unraid-api…' }}</span>
    </template>
    <span
      v-else
      class="w-full flex flex-row justify-start items-center gap-x-8px"
    >
      <template v-if="unraidApiStatus === 'offline'">
        <ExclamationTriangleIcon class="text-red-500 w-16px h-16px" />
        {{ 'Not connected' }}
      </template>
      <template v-if="unraidApiStatus === 'online'">
        <CheckCircleIcon class="text-green-500 w-16px h-16px" />
        {{ 'Connected' }}
      </template>
    </span>
    <div v-if="unraidApiRestartAction" class="w-full -mx-32px">
      <UpcDropdownItem :item="unraidApiRestartAction" />
    </div>
  </li>
</template>
