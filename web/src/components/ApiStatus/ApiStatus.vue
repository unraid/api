<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { toast } from 'sonner';

const apiStatus = ref<string>('');
const isRunning = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const isRestarting = ref<boolean>(false);

const checkStatus = async () => {
  isLoading.value = true;
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
  toast.info('Restarting API service...');

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
      toast.success('API service restart initiated. Please wait a few seconds.');
      setTimeout(() => {
        checkStatus();
      }, 3000);
    } else {
      toast.error(data.error || 'Failed to restart API service');
    }
  } catch (error) {
    console.error('Failed to restart API:', error);
    toast.error('Failed to restart API service');
  } finally {
    isRestarting.value = false;
  }
};

onMounted(() => {
  checkStatus();
});
</script>

<template>
  <div class="api-status-container">
    <div class="api-status-header">
      <h3 class="mb-2 text-lg font-semibold">API Service Status</h3>
      <div class="status-indicator">
        <span class="status-label">Status:</span>
        <span :class="['status-value', isRunning ? 'text-green-500' : 'text-orange-500']">
          {{ isLoading ? 'Loading...' : isRunning ? 'Running' : 'Not Running' }}
        </span>
      </div>
    </div>

    <div class="api-status-details">
      <pre class="status-output">{{ apiStatus }}</pre>
    </div>

    <div class="api-status-actions">
      <button @click="checkStatus" :disabled="isLoading" class="btn btn-secondary">
        {{ isLoading ? 'Refreshing...' : 'Refresh Status' }}
      </button>
      <button @click="restartApi" :disabled="isRestarting" class="btn btn-danger">
        {{ isRestarting ? 'Restarting...' : 'Restart API' }}
      </button>
    </div>

    <div class="api-status-help">
      <p class="mt-4 text-sm text-gray-600">
        View the current status of the Unraid API service and restart if needed. Use this to debug API
        connection issues.
      </p>
    </div>
  </div>
</template>

<style scoped>
.api-status-container {
  background-color: var(--background-secondary);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.api-status-header {
  margin-bottom: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.status-label {
  font-weight: 500;
}

.status-value {
  font-weight: 600;
}

.api-status-details {
  margin: 1rem 0;
}

.status-output {
  background-color: #1a1a1a;
  color: #e0e0e0;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
}

.api-status-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #4a5568;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #2d3748;
}

.btn-danger {
  background-color: #e53e3e;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c53030;
}

.api-status-help {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
  margin-top: 1.5rem;
}
</style>
