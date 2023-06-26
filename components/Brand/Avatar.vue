<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';

export interface Props {
  gradientStart?: string;
  gradientStop?: string;
}

withDefaults(defineProps<Props>(), {
  gradientStart: '#e32929',
  gradientStop: '#ff8d30',
});

const serverStore = useServerStore();
const { avatar, pluginInstalled, registered, username } = storeToRefs(serverStore);
</script>

<template>
  <figure class="group relative z-0 flex items-center justify-center w-36px h-36px rounded-full bg-gradient-to-r from-unraid-red to-orange">
    <img
      v-if="avatar && pluginInstalled && registered"
      :src="avatar"
      :alt="username"
      class="absolute z-10 inset-0 w-36px h-36px rounded-full overflow-hidden">
    <template v-else>
      <BrandMark gradient-start="#fff" gradient-stop="#fff" class="opacity-100 absolute z-10 w-36px px-4px" />
    </template>
  </figure>
</template>
