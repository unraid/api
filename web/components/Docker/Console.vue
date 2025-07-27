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
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">Terminal</h3>
      <div class="flex gap-2">
        <UButton size="sm" color="primary" variant="outline" icon="i-lucide-maximize-2">
          Fullscreen
        </UButton>
        <UButton size="sm" color="primary" variant="outline" icon="i-lucide-refresh-cw">
          Restart
        </UButton>
      </div>
    </div>
    <div class="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
      <div v-for="(line, index) in output" :key="index">
        {{ line }}
      </div>
      <div class="flex items-center">
        <span>root@{{ item.id }}:/# </span>
        <input
          v-model="command"
          class="bg-transparent outline-none flex-1 ml-1"
          type="text"
          @keyup.enter="executeCommand"
        >
      </div>
    </div>
  </div>
</template>
