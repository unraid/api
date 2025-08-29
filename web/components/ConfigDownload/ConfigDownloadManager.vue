<script setup lang="ts">
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/vue/24/outline';
import { Button, CardWrapper, PageContainer } from '@unraid/ui';
import { useQuery } from '@vue/apollo-composable';
import { convert } from 'convert';
import FileViewer from '~/components/FileViewer.vue';
import { allConfigFilesQuery } from '~/graphql/config-download.query';

const { result: data, loading, error, refetch } = useQuery(allConfigFilesQuery);

const downloadFile = (name: string, content: string) => {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadAllFiles = () => {
  if (!data.value?.allConfigFiles?.files) return;

  data.value.allConfigFiles.files.forEach((file) => {
    if (file) {
      downloadFile(file.name, file.content);
    }
  });
};

const formatFileSize = (content: string) => {
  const bytes = new TextEncoder().encode(content).length;
  return convert(bytes, 'bytes').to('best');
};
</script>

<template>
  <PageContainer>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold">Download Configuration Files</h1>
        <p class="text-muted-foreground mt-2">
          Download your API configuration files for backup or migration
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-8">
        <div class="text-muted-foreground">Loading configuration files...</div>
      </div>

      <div v-else-if="error" class="border-destructive bg-destructive/10 rounded-lg border p-4">
        <p class="text-destructive">Error loading configuration files: {{ error.message }}</p>
        <Button variant="outline" size="sm" class="mt-2" @click="refetch"> Retry </Button>
      </div>

      <div v-else-if="data?.allConfigFiles?.files">
        <div class="mb-4 flex items-center justify-between">
          <div class="text-muted-foreground text-sm">
            {{ data.allConfigFiles.files.length }} configuration files found
          </div>
          <Button
            variant="outline"
            :disabled="!data.allConfigFiles.files.length"
            @click="downloadAllFiles"
          >
            <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
            Download All Files
          </Button>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardWrapper v-for="file in data.allConfigFiles.files" :key="file.name">
            <div class="p-6">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <DocumentTextIcon class="text-muted-foreground h-5 w-5" />
                  <span class="text-base font-semibold">{{ file.name }}</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  class="h-8 w-8"
                  @click="downloadFile(file.name, file.content)"
                >
                  <ArrowDownTrayIcon class="h-4 w-4" />
                </Button>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Size:</span>
                  <span class="font-mono">{{ formatFileSize(file.content) }}</span>
                </div>
                <div v-if="file.path !== 'memory'" class="flex justify-between">
                  <span class="text-muted-foreground">Path:</span>
                  <span class="max-w-[200px] truncate font-mono text-xs" :title="file.path">
                    {{ file.path }}
                  </span>
                </div>
                <details class="mt-3">
                  <summary class="text-muted-foreground hover:text-foreground cursor-pointer">
                    Preview content
                  </summary>
                  <div class="mt-2">
                    <FileViewer 
                      :content="JSON.stringify(JSON.parse(file.content), null, 2)"
                      language="json"
                      :show-line-numbers="true"
                      max-height="300px"
                    />
                  </div>
                </details>
              </div>
            </div>
          </CardWrapper>
        </div>
      </div>

      <div v-else class="text-muted-foreground py-8 text-center">No configuration files found</div>
    </div>
  </PageContainer>
</template>
