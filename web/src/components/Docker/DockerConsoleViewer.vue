<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { useDockerConsoleSessions } from '@/composables/useDockerConsoleSessions';

interface Props {
  containerName: string;
  shell?: string;
}

const props = withDefaults(defineProps<Props>(), {
  shell: 'sh',
});

const { getSession, createSession, showSession, hideSession, destroySession, markPoppedOut } =
  useDockerConsoleSessions();

const isConnecting = ref(false);
const hasError = ref(false);
const isPoppedOut = ref(false);
const placeholderRef = ref<HTMLDivElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const socketPath = computed(() => {
  const encodedName = encodeURIComponent(props.containerName.replace(/ /g, '_'));
  return `/logterminal/${encodedName}/`;
});

const showPlaceholder = computed(() => !isConnecting.value && !hasError.value && !isPoppedOut.value);

function updatePosition() {
  if (placeholderRef.value && showPlaceholder.value) {
    const rect = placeholderRef.value.getBoundingClientRect();
    showSession(props.containerName, rect);
  }
}

async function initTerminal() {
  const existingSession = getSession(props.containerName);

  if (existingSession && !existingSession.isPoppedOut) {
    isPoppedOut.value = false;
    hasError.value = false;
    isConnecting.value = false;
    requestAnimationFrame(updatePosition);
    return;
  }

  isConnecting.value = true;
  hasError.value = false;
  isPoppedOut.value = false;

  try {
    await createSession(props.containerName, props.shell);
    isConnecting.value = false;
    requestAnimationFrame(updatePosition);
  } catch {
    hasError.value = true;
    isConnecting.value = false;
  }
}

async function reconnect() {
  destroySession(props.containerName);
  await initTerminal();
}

async function openFullscreen() {
  isPoppedOut.value = true;
  markPoppedOut(props.containerName);

  await new Promise((resolve) => setTimeout(resolve, 100));

  const params = new URLSearchParams({
    tag: 'docker',
    name: props.containerName,
    more: props.shell,
  });

  await fetch(`/webGui/include/OpenTerminal.php?${params.toString()}`);
  await new Promise((resolve) => setTimeout(resolve, 300));

  window.open(socketPath.value, '_blank', 'width=1200,height=800');
}

watch(
  () => props.containerName,
  (_newName, oldName) => {
    if (oldName) {
      hideSession(oldName);
    }
    initTerminal();
  }
);

watch(showPlaceholder, (show) => {
  if (show) {
    requestAnimationFrame(updatePosition);
  } else {
    hideSession(props.containerName);
  }
});

onMounted(() => {
  initTerminal();

  if (placeholderRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (showPlaceholder.value) {
        updatePosition();
      }
    });
    resizeObserver.observe(placeholderRef.value);
  }

  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
});

onBeforeUnmount(() => {
  hideSession(props.containerName);

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
});
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-sm text-neutral-500 dark:text-neutral-400">
        {{ containerName }}: /bin/{{ shell }}
      </span>
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

    <!-- Placeholder that the fixed-position iframe will overlay -->
    <div
      v-show="showPlaceholder"
      ref="placeholderRef"
      class="h-full w-full flex-1 rounded-lg bg-black"
    />
  </div>
</template>
