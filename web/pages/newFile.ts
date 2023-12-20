import { onBeforeMount } from 'vue';
import { nuxtApp } from './index.vue';

onBeforeMount(() => {
// @ts-ignore
nuxtApp.$customElements.registerEntry('UnraidComponents');

// serverData.value = await getServerState();
});
