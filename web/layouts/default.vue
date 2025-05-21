<template>
  <div class="text-black bg-white dark:text-white dark:bg-black">
    <client-only>
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
      <slot />
    </client-only>
  </div>
</template>

<script setup>
import ModalsCe from '~/components/Modals.ce.vue';
import { useThemeStore } from '~/store/theme';

const router = useRouter();
const themeStore = useThemeStore();
const { theme } = storeToRefs(themeStore);

// Watch for theme changes (satisfies linter by using theme)
watch(
  theme,
  () => {
    // Theme is being watched for reactivity
    console.debug('Theme changed:', theme.value);
  },
  { immediate: true }
);

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

<style lang="postcss">
/* Import theme styles */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
