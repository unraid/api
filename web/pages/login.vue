<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router';

// Access route and router
const route = useRoute();
const router = useRouter();

// Redirect to '/' with the current query parameters
router.replace({ path: '/', query: route.query });
</script>

<template>
  Redirecting you back to /
</template>