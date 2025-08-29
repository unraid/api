<template>
  <div id="app">
    <DevLayout>
      <router-view />
    </DevLayout>
  </div>
</template>

<script setup lang="ts">
import DevLayout from '@/src/layouts/DevLayout.vue';
</script>

<style scoped>
#app {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>