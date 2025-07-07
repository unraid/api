<script setup>
import { onMounted } from 'vue';
import RCloneConfig from '~/components/RClone/RCloneConfig.vue';
import RCloneOverview from '~/components/RClone/RCloneOverview.vue';

onMounted(() => {
  document.cookie = 'unraid_session_cookie=mockusersession';
});
</script>

<template>
  <div>
    <RCloneOverview />
    <RCloneConfig />
  </div>
</template>
