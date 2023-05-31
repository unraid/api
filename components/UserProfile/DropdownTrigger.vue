<script setup lang="ts">
defineEmits(['click'])
</script>

<template>
  <div class="relative flex items-center justify-end h-full">
    <button @click="$emit('click')">Open</button>
  </div>
</template>
