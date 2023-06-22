<script lang="ts" setup>
import serverState from '../_data/serverState';

const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  nuxtApp.$customElements.registerEntry('ConnectComponents');
});
</script>

<template>
  <div class="text-black bg-white dark:text-white dark:bg-black">
    <div class="max-w-5xl mx-auto">
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
          <WanIpCheckCe php-wan-ip="47.184.85.45" />
          <hr />
          <h3>ModalsCe</h3>
          <ModalsCe />
        </div>
      </client-only>
    </div>
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