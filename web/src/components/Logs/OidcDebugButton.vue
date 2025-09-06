<script setup lang="ts">
import { ref } from 'vue';

import { BugAntIcon } from '@heroicons/vue/24/outline';
import { Button } from '@unraid/ui';

import FilteredLogModal from '~/components/Logs/FilteredLogModal.vue';

const showOidcLogs = ref(false);
</script>

<template>
  <div>
    <Button variant="outline" size="sm" @click="showOidcLogs = true">
      <BugAntIcon class="mr-2 h-4 w-4" />
      View OIDC Debug Logs
    </Button>

    <FilteredLogModal
      v-model="showOidcLogs"
      log-file-path="graphql-api.log"
      filter="OIDC"
      title="OIDC Debug Logs"
      description="Viewing OIDC authentication and configuration logs"
      :line-count="200"
      :auto-scroll="true"
      highlight-language="plaintext"
    />
  </div>
</template>
