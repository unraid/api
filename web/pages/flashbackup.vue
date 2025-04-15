<script setup>
import RCloneConfig from '~/components/RClone/RCloneConfig.vue';
import { useDummyServerStore } from '~/_data/serverState';

const { registerEntry } = useCustomElements();

const serverStore = useDummyServerStore();
const { serverState } = storeToRefs(serverStore);

onBeforeMount(() => {
  registerEntry('UnraidComponents');
});

onMounted(() => {
  document.cookie = 'unraid_session_cookie=mockusersession';
});
</script>

<template>
  <div>
    {{ serverState.connectPluginInstalled }}
    <RCloneConfig />
  </div>
</template>
