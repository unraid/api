<script setup>
import RCloneConfig from '~/components/RClone/RCloneConfig.vue';
import { useDummyServerStore } from '~/_data/serverState';

const { registerEntry } = useCustomElements();

useDummyServerStore();

onBeforeMount(() => {
  registerEntry('UnraidComponents');
});

onMounted(() => {
  document.cookie = 'unraid_session_cookie=mockusersession';
});
</script>

<template>
  <div>
    <RCloneConfig />
  </div>
</template>
