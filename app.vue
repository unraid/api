<script lang="ts" setup>
import serverState from './_data/serverState';

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
        <h3>DownloadApiLogsCe</h3>
        <DownloadApiLogsCe />
        <h3>AuthCe</h3>
        <AuthCe />
        <h3>KeyActionsCe</h3>
        <KeyActionsCe />
        <h3>LaunchpadCe</h3>
        <LaunchpadCe />
        <h3>PluginPromoCe</h3>
        <PluginPromoCe />
        <h3>WanIpCheckCe</h3>
        <WanIpCheckCe />
        <h3>CallbackHandlerCe</h3>
        <CallbackHandlerCe />
      </div>
      <div class="flex flex-col gap-6 p-6">
        <h2>Web Components</h2>
        <h3>UserProfileCe</h3>
        <connect-user-profile :server="JSON.stringify(serverState)"></connect-user-profile>
        <h3>DownloadApiLogsCe</h3>
        <connect-download-api-logs></connect-download-api-logs>
        <h3>AuthCe</h3>
        <connect-auth></connect-auth>
        <h3>KeyActionsCe</h3>
        <connect-key-actions></connect-key-actions>
        <h3>LaunchpadCe</h3>
        <connect-launchpad></connect-launchpad>
        <h3>PluginPromoCe</h3>
        <connect-plugin-promo></connect-plugin-promo>
        <h3>WanIpCheckCe</h3>
        <connect-wan-ip-check></connect-wan-ip-check>
        <h3>CallbackHandlerCe</h3>
        <connect-callback-handler></connect-callback-handler>
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
</style>