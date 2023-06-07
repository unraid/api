<script lang="ts" setup>
import serverState from '../_data/serverState';

const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  nuxtApp.$customElements.registerEntry('ConnectComponents');
});
</script>

<template>
  <client-only>
    <div class="max-w-5xl mx-auto bg-gray-200">
      <div class="flex flex-col gap-6 p-6">
        <h2>Web Components</h2>
        <h3>UserProfileCe</h3>
        <connect-user-profile :server="JSON.stringify(serverState)"></connect-user-profile>
        <hr />
        <h3>DownloadApiLogsCe</h3>
        <connect-download-api-logs></connect-download-api-logs>
        <hr />
        <h3>AuthCe</h3>
        <connect-auth></connect-auth>
        <hr />
        <h3>KeyActionsCe</h3>
        <connect-key-actions></connect-key-actions>
        <hr />
        <h3>WanIpCheckCe</h3>
        <connect-wan-ip-check></connect-wan-ip-check>
        <hr />
        <h3>ModalsCe</h3>
        <connect-modals></connect-modals>
      </div>
    </div>
  </client-only>
</template>

<style lang="postcss" scoped>
h2 {
  @apply text-xl font-semibold font-mono;
}

h3 {
  @apply text-lg font-semibold font-mono;
}

hr {
  @apply border-black;
}
</style>