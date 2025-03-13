<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Input,
  Label,
  Switch
} from '@unraid/ui';
import { GET_LOG_FILES } from './log.query';
import SingleLogViewer from './SingleLogViewer.vue';

// Component state
const selectedLogFile = ref<string>('');
const lineCount = ref<number>(100);
const autoScroll = ref<boolean>(true);

// Fetch log files
const { result: logFilesResult, loading: loadingLogFiles, error: logFilesError } = useQuery(GET_LOG_FILES);

const logFiles = computed(() => {
  return logFilesResult.value?.logFiles || [];
});

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<template>
  <div class="flex flex-col h-full min-h-[400px] bg-background text-foreground rounded-lg border border-border overflow-hidden">
    <div class="p-4 border-b border-border">
      <h2 class="text-lg font-semibold mb-4">Log Viewer</h2>
      
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-[200px]">
          <Label for="log-file-select">Log File</Label>
          <Select v-model="selectedLogFile">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select a log file" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="file in logFiles" :key="file.path" :value="file.path">
                {{ file.name }} ({{ formatFileSize(file.size) }})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label for="line-count">Lines</Label>
          <Input 
            id="line-count" 
            v-model.number="lineCount" 
            type="number" 
            min="10" 
            max="1000" 
            class="w-24"
          />
        </div>
        
        <div>
          <Label for="auto-scroll">Auto-scroll</Label>
          <Switch 
            id="auto-scroll" 
            v-model:checked="autoScroll"
          />
        </div>
      </div>
    </div>
    
    <div class="flex-1 overflow-hidden relative">
      <div v-if="loadingLogFiles" class="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
        Loading log files...
      </div>
      
      <div v-else-if="logFilesError" class="flex items-center justify-center h-full p-4 text-center text-destructive">
        Error loading log files: {{ logFilesError.message }}
      </div>
      
      <div v-else-if="logFiles.length === 0" class="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
        No log files found.
      </div>
      
      <div v-else-if="!selectedLogFile" class="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
        Please select a log file to view.
      </div>
      
      <SingleLogViewer
        v-else
        :log-file-path="selectedLogFile"
        :line-count="lineCount"
        :auto-scroll="autoScroll"
        class="h-full"
      />
    </div>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
</style>

