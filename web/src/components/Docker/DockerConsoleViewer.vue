<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

interface Props {
  containerName: string;
  shell?: string;
}

const props = withDefaults(defineProps<Props>(), {
  shell: 'sh',
});

const isConnecting = ref(true);
const hasError = ref(false);
const iframeKey = ref(0);
const isPoppedOut = ref(false);

const socketPath = computed(() => {
  const encodedName = encodeURIComponent(props.containerName.replace(/ /g, '_'));
  return `/logterminal/${encodedName}/`;
});

async function initTerminal() {
  isConnecting.value = true;
  hasError.value = false;
  isPoppedOut.value = false;

  try {
    const params = new URLSearchParams({
      tag: 'docker',
      name: props.containerName,
      more: props.shell,
    });

    await fetch(`/webGui/include/OpenTerminal.php?${params.toString()}`);

    await new Promise((resolve) => setTimeout(resolve, 300));

    iframeKey.value++;
    isConnecting.value = false;
  } catch {
    hasError.value = true;
    isConnecting.value = false;
  }
}

function reconnect() {
  initTerminal();
}

async function openFullscreen() {
  // Disconnect the embedded iframe first by setting popped out mode
  // ttyd only supports one connection per socket
  isPoppedOut.value = true;

  // Wait for iframe to be destroyed
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Re-initialize ttyd for the popup (the old process may have terminated)
  const params = new URLSearchParams({
    tag: 'docker',
    name: props.containerName,
    more: props.shell,
  });

  await fetch(`/webGui/include/OpenTerminal.php?${params.toString()}`);

  // Wait for ttyd to start
  await new Promise((resolve) => setTimeout(resolve, 300));

  window.open(socketPath.value, '_blank', 'width=1200,height=800');
}

watch(
  () => props.containerName,
  () => {
    initTerminal();
  }
);

onMounted(() => {
  initTerminal();
});
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-sm text-neutral-500 dark:text-neutral-400"> {{ containerName }}: /bin/sh </span>
      <div class="flex gap-2">
        <UButton
          size="xs"
          variant="ghost"
          icon="i-lucide-maximize-2"
          :disabled="isConnecting || hasError || isPoppedOut"
          @click="openFullscreen"
        />
        <UButton
          size="xs"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          :loading="isConnecting"
          @click="reconnect"
        />
      </div>
    </div>

    <div v-if="isConnecting" class="flex flex-1 items-center justify-center rounded-lg bg-black">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-green-400" />
        <p class="mt-2 text-sm text-green-400">Connecting to container...</p>
      </div>
    </div>

    <div v-else-if="hasError" class="flex flex-1 items-center justify-center rounded-lg bg-black">
      <div class="text-center">
        <UIcon name="i-lucide-alert-circle" class="h-8 w-8 text-red-400" />
        <p class="mt-2 text-sm text-red-400">Failed to connect to container</p>
        <UButton size="xs" variant="outline" color="error" class="mt-4" @click="reconnect">
          Retry
        </UButton>
      </div>
    </div>

    <div v-else-if="isPoppedOut" class="flex flex-1 items-center justify-center rounded-lg bg-black">
      <div class="text-center">
        <UIcon name="i-lucide-external-link" class="h-8 w-8 text-neutral-400" />
        <p class="mt-2 text-sm text-neutral-400">Console opened in separate window</p>
        <UButton size="xs" variant="outline" color="neutral" class="mt-4" @click="reconnect">
          Reconnect here
        </UButton>
      </div>
    </div>

    <iframe v-else :key="iframeKey" :src="socketPath" class="h-full w-full flex-1 rounded-lg border-0" />
  </div>
</template>
