<script lang="ts" setup>
// shadow-[var(--ring-offset-shadow)_var(--ring-shadow)_var(--shadow-beta)]
//  border border-solid border-beta/5
</script>

<template>
  <nav class="flex flex-col gap-y-8px p-8px bg-alpha rounded-lg shadow-xl shadow-orange/10">
    <slot/>
  </nav>
</template>
