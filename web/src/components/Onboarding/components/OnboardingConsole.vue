<script lang="ts" setup>
export interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp?: number;
}

defineProps<{
  logs: LogEntry[];
  title?: string;
}>();

const formatTime = (ts?: number) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
</script>

<template>
  <div
    class="flex h-64 w-full flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900 font-mono text-sm text-gray-200 shadow-inner"
  >
    <!-- Header / Title -->
    <div class="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-2">
      <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">{{
        title || 'Setup Console'
      }}</span>
      <div class="flex gap-1.5">
        <div class="h-2.5 w-2.5 rounded-full bg-red-500/20" />
        <div class="h-2.5 w-2.5 rounded-full bg-yellow-500/20" />
        <div class="h-2.5 w-2.5 rounded-full bg-green-500/20" />
      </div>
    </div>

    <!-- Logs Area -->
    <div
      class="scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent flex-1 space-y-1 overflow-y-auto p-4"
    >
      <div v-if="logs.length === 0" class="text-gray-600 italic">Waiting...</div>
      <div v-for="(log, idx) in logs" :key="idx" class="flex gap-3">
        <span v-if="log.timestamp" class="shrink-0 text-gray-500 select-none"
          >[{{ formatTime(log.timestamp) }}]</span
        >
        <span
          :class="{
            'text-gray-300': log.type === 'info',
            'text-green-400': log.type === 'success',
            'text-red-400': log.type === 'error',
          }"
        >
          <span v-if="log.type === 'success'" class="mr-1">✓</span>
          <span v-if="log.type === 'error'" class="mr-1">✗</span>
          <span v-if="log.type === 'info'" class="mr-1">➜</span>
          {{ log.message }}
        </span>
      </div>
      <!-- Blinking cursor at the end -->
      <div class="mt-1 animate-pulse text-gray-500">_</div>
    </div>
  </div>
</template>
