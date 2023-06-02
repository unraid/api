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
        <UserProfileCe :server="serverState" />
        <DownloadApiLogsCe />
        <AuthCe />
        <KeyActionsCe />
        <LaunchpadCe />
        <PluginPromoCe />
        <WanIpCheckCe />
        <CallbackHandlerCe />
      </div>
      <div class="flex flex-col gap-6 p-6">
        <h2>Web Components</h2>
        <connect-user-profile :server="JSON.stringify(serverState)"></connect-user-profile>
        <connect-download-api-logs></connect-download-api-logs>
        <connect-auth></connect-auth>
        <connect-key-actions></connect-key-actions>
        <connect-launchpad></connect-launchpad>
        <connect-plugin-promo></connect-plugin-promo>
        <connect-wan-ip-check></connect-wan-ip-check>
        <connect-callback-handler></connect-callback-handler>
      </div>
    </client-only>
  </div>
</template>

<style lang="postcss">
h2 {
  @apply text-xl font-semibold font-mono;
}
</style>