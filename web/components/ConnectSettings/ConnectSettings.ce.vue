<script lang="ts" setup>
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

// import { useI18n } from 'vue-i18n';

// const { t } = useI18n();
</script>

<template>
  <AuthCe />
  <!-- @todo: flashback up -->
  <WanIpCheckCe />
  <ConnectSettingsRemoteAccess />
  <ConnectSettingsAllowedOrigins />
  <DownloadApiLogsCe />
</template>
