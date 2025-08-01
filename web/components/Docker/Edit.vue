<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  item: {
    id: string;
    label: string;
    icon?: string;
    badge?: string | number;
  };
}

const props = defineProps<Props>();

const config = ref({
  name: props.item.label,
  image: 'ghcr.io/imagegenius/immich:latest',
  network: 'bridge',
  restartPolicy: 'unless-stopped',
  cpuLimit: '',
  memoryLimit: '',
  ports: [{ container: '7878', host: '7878', protocol: 'tcp' }],
  volumes: [
    { container: '/config', host: '/mnt/user/appdata/immich' },
    { container: '/media', host: '/mnt/user/media' },
  ],
  environment: [
    { key: 'PUID', value: '99' },
    { key: 'PGID', value: '100' },
  ],
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center sm:mx-4">
      <h3 class="text-lg font-medium">Container Configuration</h3>
      <div class="flex gap-2">
        <UButton color="primary" variant="outline">Cancel</UButton>
        <UButton color="primary">Save Changes</UButton>
      </div>
    </div>

    <UCard class="sm:mx-4">
      <template #header>
        <h4 class="font-medium">Basic Settings</h4>
      </template>
      <div class="space-y-4">
        <UFormField label="Container Name">
          <UInput v-model="config.name" />
        </UFormField>
        <UFormField label="Image">
          <UInput v-model="config.image" />
        </UFormField>
        <UFormField label="Network Mode">
          <USelectMenu v-model="config.network" :options="['bridge', 'host', 'none', 'custom']" />
        </UFormField>
        <UFormField label="Restart Policy">
          <USelectMenu
            v-model="config.restartPolicy"
            :options="['no', 'always', 'unless-stopped', 'on-failure']"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard class="sm:mx-4">
      <template #header>
        <h4 class="font-medium">Resource Limits</h4>
      </template>
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="CPU Limit">
          <UInput v-model="config.cpuLimit" placeholder="e.g., 0.5 or 2" />
        </UFormField>
        <UFormField label="Memory Limit">
          <UInput v-model="config.memoryLimit" placeholder="e.g., 512m or 2g" />
        </UFormField>
      </div>
    </UCard>

    <UCard class="sm:mx-4">
      <template #header>
        <h4 class="font-medium">Port Mappings</h4>
      </template>
      <div class="space-y-2">
        <div v-for="(port, index) in config.ports" :key="index" class="flex gap-2 items-center">
          <UInput v-model="port.host" placeholder="Host Port" class="flex-1" />
          <UIcon name="i-lucide-arrow-right" class="text-gray-400" />
          <UInput v-model="port.container" placeholder="Container Port" class="flex-1" />
          <USelectMenu v-model="port.protocol" :options="['tcp', 'udp']" class="w-24" />
          <UButton icon="i-lucide-trash-2" color="primary" variant="ghost" size="sm" />
        </div>
        <UButton icon="i-lucide-plus" size="sm" variant="outline">Add Port</UButton>
      </div>
    </UCard>

    <UCard class="sm:mx-4">
      <template #header>
        <h4 class="font-medium">Volume Mappings</h4>
      </template>
      <div class="space-y-2">
        <div v-for="(volume, index) in config.volumes" :key="index" class="flex gap-2 items-center">
          <UInput v-model="volume.host" placeholder="Host Path" class="flex-1" />
          <UIcon name="i-lucide-arrow-right" class="text-gray-400" />
          <UInput v-model="volume.container" placeholder="Container Path" class="flex-1" />
          <UButton icon="i-lucide-trash-2" color="primary" variant="ghost" size="sm" />
        </div>
        <UButton icon="i-lucide-plus" size="sm" variant="outline">Add Volume</UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h4 class="font-medium">Environment Variables</h4>
      </template>
      <div class="space-y-2">
        <div v-for="(env, index) in config.environment" :key="index" class="flex gap-2 items-center">
          <UInput v-model="env.key" placeholder="Variable Name" class="flex-1" />
          <UInput v-model="env.value" placeholder="Value" class="flex-1" />
          <UButton icon="i-lucide-trash-2" color="primary" variant="ghost" size="sm" />
        </div>
        <UButton icon="i-lucide-plus" size="sm" variant="outline">Add Variable</UButton>
      </div>
    </UCard>
  </div>
</template>
