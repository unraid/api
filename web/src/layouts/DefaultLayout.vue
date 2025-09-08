<script setup lang="ts">
// Minimal default layout - primarily for any standalone Vue app usage
// Web components should not use this layout as they manage their own styling
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
    <!-- Minimal layout for production Vue app if needed -->
    <main class="container mx-auto">
      <slot />
    </main>
  </div>
</template>

<style scoped>
/* Minimal font scaling fixes for production use */
:deep(*) {
  font-size: max(16px, 1rem);
}

:deep(h1) {
  font-size: max(32px, 2rem);
}

:deep(h2) {
  font-size: max(24px, 1.5rem);
}

:deep(h3) {
  font-size: max(20px, 1.25rem);
}
</style>
