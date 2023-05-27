<script lang="ts" setup>
import type { Server } from '~/types/server';
const nuxtApp = useNuxtApp();

const server = ref<Server>({
  name: 'DevServer9000',
  description: 'Fully automated media server and lab rig',
  guid: '9292-1111-BITE-1111-444444444444',
  deviceCount: 8,
  site: 'http://localhost:4321',
  state: 'TRIAL',
  keyTypeForPurchase: 'Trial',
  locale: 'en',
});

onBeforeMount(() => {
  nuxtApp.$customElements.registerEntry('ConnectComponents');
});
</script>

<template>
  <div class="max-w-5xl mx-auto bg-gray-200">
    <client-only>
      <div class="flex flex-col gap-6 p-6">
        <h2>Vue Components</h2>
        <UserProfileCe :server="server" />
        <AuthCe />
        <KeyActionsCe />
        <LaunchpadCe />
        <PluginPromoCe />
        <WanIpCheckCe />
        <CallbackHandlerCe />
      </div>
      <div class="flex flex-col gap-6 p-6">
        <h2>Web Components</h2>
        <connect-user-profile :server="JSON.stringify(server)"></connect-user-profile>
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