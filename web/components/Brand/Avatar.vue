<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';

import BrandMark from '~/components/Brand/Mark.vue';

export interface Props {
  gradientStart?: string;
  gradientStop?: string;
}

withDefaults(defineProps<Props>(), {
  gradientStart: '#e32929',
  gradientStop: '#ff8d30',
});

const serverStore = useServerStore();
const { avatar, connectPluginInstalled, registered, username } = storeToRefs(serverStore);
</script>

<template>
  <figure class="group relative z-0 flex items-center justify-center w-9 h-9 rounded-full bg-linear-to-r from-unraid-red to-orange">
    <img
      v-if="avatar && connectPluginInstalled && registered"
      :src="avatar"
      :alt="username"
      class="absolute z-10 inset-0 w-9 h-9 rounded-full overflow-hidden"
    >
    <template v-else>
      <BrandMark gradient-start="#fff" gradient-stop="#fff" class="opacity-100 absolute z-10 w-9 px-[4px]" />
    </template>
  </figure>
</template>
