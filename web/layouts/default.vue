<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { ClientOnly, NuxtLink } from '#components';

import ColorSwitcherCe from '~/components/ColorSwitcher.ce.vue';
import DummyServerSwitcher from '~/components/DummyServerSwitcher.vue';
import ModalsCe from '~/components/Modals.ce.vue';

const router = useRouter();

const routes = computed(() => {
  return router
    .getRoutes()
    .filter((route) => !route.path.includes(':') && route.path !== '/404' && route.name)
    .sort((a, b) => a.path.localeCompare(b.path));
});

function formatRouteName(name: string | undefined) {
  if (!name) return 'Home';
  // Convert route names like "web-components" to "Web Components"
  return name
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
</script>

<template>
  <div class="text-black bg-white dark:text-white dark:bg-black">
    <ClientOnly>
      <div class="flex flex-row items-center justify-center gap-6 p-6 bg-white dark:bg-zinc-800">
        <template v-for="route in routes" :key="route.path">
          <NuxtLink
            :to="route.path"
            class="underline hover:no-underline focus:no-underline"
            active-class="text-orange"
          >
            {{ formatRouteName(route.name) }}
          </NuxtLink>
        </template>
        <ModalsCe />
      </div>
      <div class="flex flex-col w-full justify-center gap-6 p-6 bg-white dark:bg-zinc-800">
        <DummyServerSwitcher />
        <ColorSwitcherCe />
      </div>
      <slot />
    </ClientOnly>
  </div>
</template>

<style>
/* Import theme styles */
@import '~/assets/main.css';
</style>
