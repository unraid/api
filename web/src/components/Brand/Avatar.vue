<script setup lang="ts">
import { storeToRefs } from 'pinia';

import BrandMark from '~/components/Brand/Mark.vue';
import { useServerStore } from '~/store/server';

// No props needed for this component
defineProps();

const serverStore = useServerStore();
const { avatar, connectPluginInstalled, registered, username } = storeToRefs(serverStore);
</script>

<template>
  <figure
    class="group from-unraid-red to-orange relative z-0 flex h-9 w-9 min-w-9 flex-shrink-0 items-center justify-center rounded-full bg-linear-to-r"
  >
    <img
      v-if="avatar && connectPluginInstalled && registered"
      :src="avatar"
      :alt="username"
      class="absolute inset-0 z-10 h-9 w-9 overflow-hidden rounded-full object-cover"
    />
    <template v-else>
      <BrandMark
        gradient-start="#fff"
        gradient-stop="#fff"
        class="absolute z-10 h-9 w-9 p-[6px] opacity-100"
      />
    </template>
  </figure>
</template>
