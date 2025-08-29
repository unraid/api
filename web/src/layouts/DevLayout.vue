<script setup lang="ts">
// Development-only layout for testing web components
// This layout should NOT be used in production or by actual web components
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Badge, Toaster } from '@unraid/ui';

import ColorSwitcherCe from '~/components/ColorSwitcher.ce.vue';
import DummyServerSwitcher from '~/components/DummyServerSwitcher.vue';
// Use custom element instead of importing the component directly

const router = useRouter();
const openDropdown = ref<string | null>(null);
const componentsReady = ref(false);

// Register web components when layout mounts
onMounted(async () => {
  try {
    // Import and register all web components
    await import('@/src/register');
    console.log('[DevLayout] Web components registered');
    
    // Wait a bit for components to be fully registered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if modals component is registered
    if (customElements.get('unraid-modals')) {
      console.log('[DevLayout] unraid-modals component is ready');
      componentsReady.value = true;
    } else {
      console.warn('[DevLayout] unraid-modals component not found');
      // Still set ready to avoid infinite loading
      componentsReady.value = true;
    }
  } catch (error) {
    console.error('[DevLayout] Failed to register web components:', error);
    componentsReady.value = true; // Set ready even on error to avoid infinite loading
  }
});

const toggleDropdown = (routePath: string) => {
  openDropdown.value = openDropdown.value === routePath ? null : routePath;
};

const routes = computed(() => {
  const allRoutes = router
    .getRoutes()
    .filter((route) => !route.path.includes(':') && route.path !== '/404' && route.name && route.meta?.title)
    .sort((a, b) => a.path.localeCompare(b.path));
  
  // Group routes by parent path
  const grouped = new Map<string, any>();
  const topLevel: any[] = [];
  
  allRoutes.forEach(route => {
    const pathParts = route.path.split('/').filter(Boolean);
    
    if (pathParts.length === 1 || (pathParts.length === 2 && pathParts[0] === 'dev')) {
      // Top level route
      const existing = grouped.get(pathParts[pathParts.length - 1]);
      if (existing) {
        // Already have a parent with this name, skip adding duplicate
        return;
      }
      topLevel.push({
        ...route,
        children: []
      });
      grouped.set(pathParts[pathParts.length - 1], topLevel[topLevel.length - 1]);
    } else if (pathParts.length >= 3) {
      // Nested route - find or create parent
      const parentPath = pathParts[1]; // Skip 'dev' prefix
      let parent = grouped.get(parentPath);
      
      if (!parent) {
        // Create a virtual parent route
        parent = {
          path: `/dev/${parentPath}`,
          name: parentPath,
          meta: { title: parentPath.charAt(0).toUpperCase() + parentPath.slice(1) },
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

function formatRouteName(name: string | symbol | undefined, meta?: any, path?: string) {
  if (meta?.title) return meta.title;
  if (!name) return 'Home';
  
  // Convert symbols to strings if needed
  const nameStr = typeof name === 'symbol' ? name.toString() : name;
  
  // For nested routes, show the last part of the path
  if (path && path.includes('/') && path.split('/').filter(Boolean).length > 2) {
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
  <!-- Development Layout - NOT for production use -->
  <div class="text-black bg-white dark:text-white dark:bg-black min-h-screen">
    <div class="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4">
        <nav class="flex flex-wrap items-center gap-2">
          <template v-for="route in routes" :key="route.path">
            <!-- Routes with children get a dropdown -->
            <div v-if="route.children && route.children.length > 0" class="relative">
              <Badge 
                :variant="$route.path.startsWith(route.path) ? 'orange' : 'gray'"
                size="xs"
                class="cursor-pointer flex items-center gap-1"
                @click="toggleDropdown(route.path)"
              >
                {{ formatRouteName(route.name, route.meta) }}
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
                <router-link
                  v-for="child in route.children"
                  :key="child.path"
                  :to="child.path"
                  class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                  @click="openDropdown = null"
                >
                  {{ formatRouteName(child.name, child.meta, child.path) }}
                </router-link>
              </div>
            </div>
            
            <!-- Regular routes without children -->
            <router-link v-else :to="route.path">
              <Badge 
                :variant="$route.path === route.path ? 'orange' : 'gray'"
                size="xs"
                class="cursor-pointer"
              >
                {{ formatRouteName(route.name, route.meta) }}
              </Badge>
            </router-link>
          </template>
        </nav>
        <unraid-modals v-if="componentsReady" />
      </div>
    </div>
    
    <div class="flex flex-col md:flex-row items-center justify-center gap-3 p-3 md:p-4 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-gray-700">
      <DummyServerSwitcher />
      <ColorSwitcherCe />
    </div>
    
    <main class="flex-1">
      <slot />
    </main>
    
    <Toaster />
  </div>
</template>

<style scoped>
/* Apply Unraid's font scaling system for proper readability */
/* Base font size is 10px, these variables scale up from that base */
:deep(*) {
  font-size: var(--text-base) !important; /* 16px at 10px base */
}

:deep(h1) {
  font-size: var(--text-3xl) !important; /* 30px at 10px base */
}

:deep(h2) {
  font-size: var(--text-2xl) !important; /* 24px at 10px base */
}

:deep(h3) {
  font-size: var(--text-xl) !important; /* 20px at 10px base */
}

:deep(h4) {
  font-size: var(--text-lg) !important; /* 18px at 10px base */
}

:deep(h5) {
  font-size: var(--text-base) !important; /* 16px at 10px base */
}

:deep(h6) {
  font-size: var(--text-sm) !important; /* 14px at 10px base */
}

:deep(.text-xs) {
  font-size: var(--text-xs) !important; /* 12px at 10px base */
}

:deep(.text-sm) {
  font-size: var(--text-sm) !important; /* 14px at 10px base */
}

:deep(.text-base) {
  font-size: var(--text-base) !important; /* 16px at 10px base */
}

:deep(.text-lg) {
  font-size: var(--text-lg) !important; /* 18px at 10px base */
}

:deep(.text-xl) {
  font-size: var(--text-xl) !important; /* 20px at 10px base */
}

:deep(.text-2xl) {
  font-size: var(--text-2xl) !important; /* 24px at 10px base */
}

:deep(.text-3xl) {
  font-size: var(--text-3xl) !important; /* 30px at 10px base */
}

:deep(.text-4xl) {
  font-size: var(--text-4xl) !important; /* 36px at 10px base */
}

:deep(.text-5xl) {
  font-size: var(--text-5xl) !important; /* 48px at 10px base */
}

:deep(.text-6xl) {
  font-size: var(--text-6xl) !important; /* 60px at 10px base */
}
</style>