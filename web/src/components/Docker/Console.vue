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
const command = ref('');
const output = ref<string[]>([
  `root@${props.item.id}:/# echo "Welcome to ${props.item.label}"`,
  `Welcome to ${props.item.label}`,
  `root@${props.item.id}:/#`,
]);

const executeCommand = () => {
  if (command.value.trim()) {
    output.value.push(`root@${props.item.id}:/# ${command.value}`);
    output.value.push(`${command.value}: command executed`);
    output.value.push(`root@${props.item.id}:/#`);
    command.value = '';
  }
};
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between sm:mx-4">
      <h3 class="text-lg font-medium">Terminal</h3>
      <div class="flex gap-2">
        <UButton size="sm" color="primary" variant="outline" icon="i-lucide-maximize-2">
          <span class="hidden sm:inline">Fullscreen</span>
        </UButton>
        <UButton size="sm" color="primary" variant="outline" icon="i-lucide-refresh-cw">
          <span class="hidden sm:inline">Restart</span>
        </UButton>
      </div>
    </div>
    <div class="h-96 overflow-y-auto rounded-lg bg-black p-4 font-mono text-sm text-green-400 sm:mx-4">
      <div v-for="(line, index) in output" :key="index">
        {{ line }}
      </div>
      <div class="flex items-center">
        <span>root@{{ item.id }}:/# </span>
        <input
          v-model="command"
          class="ml-1 flex-1 bg-transparent outline-none"
          type="text"
          @keyup.enter="executeCommand"
        />
      </div>
    </div>
  </div>
</template>
