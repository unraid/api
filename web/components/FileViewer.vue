<script setup lang="ts">
import { computed } from 'vue';
import { useContentHighlighting } from '~/composables/useContentHighlighting';

const props = defineProps<{
  content: string;
  language?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  class?: string;
}>();

const { highlightContent } = useContentHighlighting();

const highlightedContent = computed(() => {
  return highlightContent(props.content, props.language);
});

const lines = computed(() => {
  return props.content.split('\n');
});
</script>

<template>
  <div 
    :class="[
      'file-viewer-container',
      'relative rounded border bg-background text-foreground overflow-hidden',
      props.class
    ]"
    :style="{ height: maxHeight || '300px' }"
  >
    <div class="absolute inset-0 overflow-auto">
      <div class="flex min-w-full">
        <!-- Line numbers -->
        <div 
          v-if="showLineNumbers" 
          class="flex-shrink-0 select-none border-r bg-muted/50 px-2 py-2 text-xs font-mono text-muted-foreground"
        >
          <div v-for="(_, index) in lines" :key="index" class="leading-5 text-right pr-2">
            {{ index + 1 }}
          </div>
        </div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <pre 
            class="p-3 text-xs font-mono leading-5 whitespace-pre m-0"
            v-html="highlightedContent"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add some basic styling for the highlighted content */
:deep(.hljs) {
  background: transparent;
}

/* ANSI color classes */
:deep(.ansi-bright-black) { color: #666; }
:deep(.ansi-bright-red) { color: #ff6b6b; }
:deep(.ansi-bright-green) { color: #51cf66; }
:deep(.ansi-bright-yellow) { color: #ffd43b; }
:deep(.ansi-bright-blue) { color: #339af0; }
:deep(.ansi-bright-magenta) { color: #f06292; }
:deep(.ansi-bright-cyan) { color: #22d3ee; }
:deep(.ansi-bright-white) { color: #f8f9fa; }

/* Standard ANSI colors for dark theme */
:deep(.ansi-black) { color: #000; }
:deep(.ansi-red) { color: #e03131; }
:deep(.ansi-green) { color: #2f9e44; }
:deep(.ansi-yellow) { color: #f59f00; }
:deep(.ansi-blue) { color: #1971c2; }
:deep(.ansi-magenta) { color: #c2255c; }
:deep(.ansi-cyan) { color: #0891b2; }
:deep(.ansi-white) { color: #495057; }
</style>
