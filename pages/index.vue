<script lang="ts" setup>
import serverState from '../_data/serverState';

const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  nuxtApp.$customElements.registerEntry('ConnectComponents');
});
</script>

<template>
  <div class="max-w-5xl mx-auto bg-gray-200">
    <client-only>
      <div class="flex flex-col gap-6 p-6">
        <h2>Vue Components</h2>
        <h3>UserProfileCe</h3>
        <UserProfileCe :server="serverState" />
        <hr />
        <h3>DownloadApiLogsCe</h3>
        <DownloadApiLogsCe />
        <hr />
        <h3>AuthCe</h3>
        <AuthCe />
        <hr />
        <h3>KeyActionsCe</h3>
        <KeyActionsCe />
        <hr />
        <h3>WanIpCheckCe</h3>
        <WanIpCheckCe />
        <hr />
        <h3>ModalsCe</h3>
        <ModalsCe />
      </div>
    </client-only>
  </div>
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