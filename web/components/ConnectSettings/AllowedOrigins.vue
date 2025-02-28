<script lang="ts" setup>
import { BrandButton, Button, Input } from '@unraid/ui';

import { useUnraidApiSettingsStore } from '~/store/unraidApiSettings';

const apiSettingsStore = useUnraidApiSettingsStore();

const originsText = ref<string>('');
const errors = ref<string[]>([]);

onMounted(async () => {
  const allowedOriginsSettings = await apiSettingsStore.getAllowedOrigins();
  originsText.value = allowedOriginsSettings.join(', ');
});

const origins = computed<string[]>(() => {
  console.log('originsText.value: ' + originsText.value);
  const newOrigins: string[] = [];
  if (originsText.value) {
    originsText.value.split(',').forEach((origin) => {
      try {
        const newUrl = new URL(origin.trim());
        newOrigins.push(newUrl.toString());
      } catch {
        errors.value.push(`Invalid origin: ${origin}`);
      }
    });
  }

  return newOrigins;
});

const setAllowedOrigins = () => {
  apiSettingsStore.setAllowedOrigins(origins.value);
};
</script>

<template>
  <div class="space-y-3 max-w-4xl">
    <Input
      v-model="originsText"
      type="text"
      placeholder="https://abc.myreverseproxy.com,https://xyz.rvrsprx.com"
    />
    <BrandButton type="button" variant="outline" text="Apply" @click="setAllowedOrigins()">
    </BrandButton>
    <div v-for="(error, index) of errors" :key="index">
      <p>{{ error }}</p>
    </div>
  </div>
</template>
