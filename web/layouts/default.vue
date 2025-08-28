<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ClientOnly, NuxtLink } from '#components';
import { Badge, Toaster } from '@unraid/ui';

import ColorSwitcherCe from '~/components/ColorSwitcher.ce.vue';
import DummyServerSwitcher from '~/components/DummyServerSwitcher.vue';
import ModalsCe from '~/components/Modals.ce.vue';

const router = useRouter();
const openDropdown = ref<string | null>(null);

const toggleDropdown = (routePath: string) => {
  openDropdown.value = openDropdown.value === routePath ? null : routePath;
};

const routes = computed(() => {
  const allRoutes = router
    .getRoutes()
    .filter((route) => !route.path.includes(':') && route.path !== '/404' && route.name)
    .sort((a, b) => a.path.localeCompare(b.path));
  
  // Group routes by parent path
  const grouped = new Map<string, any>();
  const topLevel: any[] = [];
  
  allRoutes.forEach(route => {
    const pathParts = route.path.split('/').filter(Boolean);
    
    if (pathParts.length === 1) {
      // Top level route
      const existing = grouped.get(pathParts[0]);
      if (existing) {
        // Already have a parent with this name, skip adding duplicate
        return;
      }
      topLevel.push({
        ...route,
        children: []
      });
      grouped.set(pathParts[0], topLevel[topLevel.length - 1]);
    } else if (pathParts.length >= 2) {
      // Nested route - find or create parent
      const parentPath = pathParts[0];
      let parent = grouped.get(parentPath);
      
      if (!parent) {
        // Create a virtual parent route
        parent = {
          path: `/${parentPath}`,
          name: parentPath,
          children: []
        };
        topLevel.push(parent);
        grouped.set(parentPath, parent);
      }
      
      parent.children.push(route);
    }
  });
  
  return topLevel;
});

function formatRouteName(name: string | symbol | undefined, path?: string) {
  if (!name) return 'Home';
  // Convert symbols to strings if needed
  const nameStr = typeof name === 'symbol' ? name.toString() : name;
  
  // For nested routes, show the last part of the path
  if (path && path.includes('/') && path.split('/').filter(Boolean).length > 1) {
    const lastPart = path.split('/').pop();
    return lastPart ? lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ') : nameStr;
  }
  
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
      <div class="bg-white dark:bg-zinc-800 border-b border-muted">
        <div class="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4">
          <nav class="flex flex-wrap items-center gap-2">
            <template v-for="route in routes" :key="route.path">
              <!-- Routes with children get a dropdown -->
              <div v-if="route.children && route.children.length > 0" class="relative">
                <Badge 
                  :variant="router.currentRoute.value.path.startsWith(route.path) ? 'orange' : 'gray'"
                  size="xs"
                  class="cursor-pointer flex items-center gap-1"
                  @click="toggleDropdown(route.path)"
                >
                  {{ formatRouteName(route.name) }}
                  <svg 
                    class="w-3 h-3 transition-transform"
                    :class="openDropdown === route.path && 'rotate-180'"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </Badge>
                
                <!-- Dropdown menu -->
                <div 
                  v-if="openDropdown === route.path"
                  class="absolute top-full mt-1 left-0 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[150px]"
                >
                  <NuxtLink
                    v-for="child in route.children"
                    :key="child.path"
                    :to="child.path"
                    class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                    @click="openDropdown = null"
                  >
                    {{ formatRouteName(child.name, child.path) }}
                  </NuxtLink>
                </div>
              </div>
              
              <!-- Regular routes without children -->
              <NuxtLink v-else :to="route.path">
                <Badge 
                  :variant="router.currentRoute.value.path === route.path ? 'orange' : 'gray'"
                  size="xs"
                  class="cursor-pointer header-nav-badge hover:brightness-90 hover:bg-transparent [&.bg-gray-200]:hover:bg-gray-200 [&.bg-orange]:hover:bg-orange"
                >
                  {{ formatRouteName(route.name) }}
                </Badge>
              </NuxtLink>
            </template>
          </nav>
          <ModalsCe />
        </div>
      </div>
      <div class="flex flex-col md:flex-row items-center justify-center gap-3 p-3 md:p-4 bg-gray-50 dark:bg-zinc-900 border-b border-muted">
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
