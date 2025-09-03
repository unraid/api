<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { ClientOnly, NuxtLink } from '#components';
import { Badge, Toaster } from '@unraid/ui';

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

function formatRouteName(name: string | symbol | undefined) {
  if (!name) return 'Home';
  // Convert symbols to strings if needed
  const nameStr = typeof name === 'symbol' ? name.toString() : name;
  // Convert route names like "web-components" to "Web Components"
  return nameStr
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
</script>

<template>
  <div class="text-black bg-white dark:text-white dark:bg-black">
    <ClientOnly>
      <div class="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-gray-700">
        <div class="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4">
          <nav class="flex flex-wrap items-center gap-2">
            <template v-for="route in routes" :key="route.path">
              <NuxtLink :to="route.path">
                <Badge 
                  :variant="router.currentRoute.value.path === route.path ? 'orange' : 'gray'"
                  size="xs"
                  class="cursor-pointer"
                >
                  {{ formatRouteName(route.name) }}
                </Badge>
              </NuxtLink>
            </template>
          </nav>
          <ModalsCe />
        </div>
      </div>
      <div class="flex flex-col md:flex-row items-center justify-center gap-3 p-3 md:p-4 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-gray-700">
        <DummyServerSwitcher />
        <ColorSwitcherCe />
      </div>
      <slot />
      <Toaster />
    </ClientOnly>
  </div>
</template>

<style>
/* Import theme styles */
@import '~/assets/main.css';
</style>
