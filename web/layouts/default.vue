<template>
  <client-only>
    <div class="flex flex-row items-center justify-center gap-6 p-6 text-gray-200 bg-zinc-800">
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
    <slot />
  </client-only>
</template>

<script setup>
import ModalsCe from '~/components/Modals.ce.vue';

const router = useRouter();
const routes = computed(() => {
  return router
    .getRoutes()
    .filter((route) => !route.path.includes(':') && route.path !== '/404' && route.name)
    .sort((a, b) => a.path.localeCompare(b.path));
});

function formatRouteName(name) {
  if (!name) return 'Home';
  // Convert route names like "web-components" to "Web Components"
  return name
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
</script>
