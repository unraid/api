<script lang="ts" setup>
import { onMounted, ref } from 'vue';

const apiStatus = ref<string>('');
const isRunning = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const isRestarting = ref<boolean>(false);
const statusMessage = ref<string>('');
const messageType = ref<'success' | 'error' | 'info' | ''>('');

const checkStatus = async () => {
  isLoading.value = true;
  statusMessage.value = '';
  try {
    const response = await fetch('/plugins/dynamix.my.servers/include/unraid-api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'command=status',
    });

    const data = await response.json();
    if (data.result) {
      apiStatus.value = data.result;
      isRunning.value = data.result.includes('running') || data.result.includes('active');
    }
  } catch (error) {
    console.error('Failed to get API status:', error);
    apiStatus.value = 'Error fetching status';
    isRunning.value = false;
    statusMessage.value = 'Failed to fetch API status';
    messageType.value = 'error';
  } finally {
    isLoading.value = false;
  }
};

const restartApi = async () => {
  const confirmed = window.confirm(
    'Are you sure you want to restart the Unraid API service? This will temporarily interrupt API connections.'
  );

  if (!confirmed) return;

  isRestarting.value = true;
  statusMessage.value = 'Restarting API service...';
  messageType.value = 'info';

  try {
    const response = await fetch('/plugins/dynamix.my.servers/include/unraid-api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'command=restart',
    });

    const data = await response.json();
    if (data.success) {
      statusMessage.value = 'API service restart initiated. Please wait a few seconds.';
      messageType.value = 'success';
      setTimeout(() => {
        checkStatus();
      }, 3000);
    } else {
      statusMessage.value = data.error || 'Failed to restart API service';
      messageType.value = 'error';
    }
  } catch (error) {
    console.error('Failed to restart API:', error);
    statusMessage.value = 'Failed to restart API service';
    messageType.value = 'error';
  } finally {
    isRestarting.value = false;
  }
};

onMounted(() => {
  checkStatus();
});
</script>

<template>
  <div class="bg-muted border-muted my-4 rounded-lg border p-6">
    <div class="mb-4">
      <h3 class="mb-2 text-lg font-semibold">API Service Status</h3>
      <div class="flex items-center gap-2 text-sm">
        <span class="font-medium">Status:</span>
        <span :class="['font-semibold', isRunning ? 'text-green-500' : 'text-orange-500']">
          {{ isLoading ? 'Loading...' : isRunning ? 'Running' : 'Not Running' }}
        </span>
      </div>
    </div>

    <div class="my-4">
      <pre
        class="max-h-52 overflow-y-auto rounded bg-black p-4 font-mono text-xs break-words whitespace-pre-wrap text-white"
        >{{ apiStatus }}</pre
      >
    </div>

    <div
      v-if="statusMessage"
      :class="[
        'my-4 rounded px-4 py-3 text-sm',
        messageType === 'success' && 'bg-green-500 text-white',
        messageType === 'error' && 'bg-red-500 text-white',
        messageType === 'info' && 'bg-blue-500 text-white',
      ]"
    >
      {{ statusMessage }}
    </div>

    <div class="mt-4 flex gap-4">
      <button
        @click="checkStatus"
        :disabled="isLoading"
        class="bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ isLoading ? 'Refreshing...' : 'Refresh Status' }}
      </button>
      <button
        @click="restartApi"
        :disabled="isRestarting"
        class="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ isRestarting ? 'Restarting...' : 'Restart API' }}
      </button>
    </div>

    <div class="border-muted mt-6 border-t pt-4">
      <p class="text-muted-foreground text-sm">
        View the current status of the Unraid API service and restart if needed. Use this to debug API
        connection issues.
      </p>
    </div>
  </div>
</template>
