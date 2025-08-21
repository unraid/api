<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button } from '@unraid/ui';
import { ClipboardDocumentIcon, LinkIcon } from '@heroicons/vue/24/outline';
import { generateAuthorizationUrl, copyAuthorizationUrl } from '~/utils/authorizationLink';
import type { Role } from '~/composables/gql/graphql';

interface RawPermission {
  resource: string;
  actions: string[];
}

interface Props {
  roles?: Role[];
  rawPermissions?: RawPermission[];
  appName?: string;
  appDescription?: string;
  redirectUrl?: string;
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  roles: () => [],
  rawPermissions: () => [],
  appName: 'CliInternal',
  appDescription: '',
  redirectUrl: '',
  show: true,
});

// State for UI interactions
const copySuccess = ref(false);
const showUrl = ref(false);

// Computed property for authorization URL
const authorizationUrl = computed(() => {
  if (!props.show || (props.roles.length === 0 && props.rawPermissions.length === 0)) {
    return '';
  }
  
  return generateAuthorizationUrl({
    appName: props.appName,
    appDescription: props.appDescription,
    roles: props.roles,
    rawPermissions: props.rawPermissions,
    redirectUrl: props.redirectUrl,
  });
});

// Check if there are any permissions to show
const hasPermissions = computed(() => {
  return props.roles.length > 0 || props.rawPermissions.length > 0;
});

// Function to copy authorization URL
const handleCopy = async () => {
  const success = await copyAuthorizationUrl({
    appName: props.appName,
    appDescription: props.appDescription,
    roles: props.roles,
    rawPermissions: props.rawPermissions,
    redirectUrl: props.redirectUrl,
  });
  
  if (success) {
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  }
};

// Function to toggle URL visibility
const toggleShowUrl = () => {
  showUrl.value = !showUrl.value;
};
</script>

<template>
  <div v-if="show && hasPermissions" class="space-y-3">
    <div>
      <h4 class="text-sm font-medium mb-2">Developer Authorization Link</h4>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="toggleShowUrl">
          <LinkIcon class="w-4 h-4 mr-1" />
          Show URL
        </Button>
        <Button variant="outline" size="sm" @click="handleCopy">
          <ClipboardDocumentIcon class="w-4 h-4 mr-1" />
          {{ copySuccess ? 'Copied!' : 'Copy' }}
        </Button>
      </div>
    </div>
    
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Use this link to create an API key authorization for <strong>{{ appName }}</strong> with the selected permissions. 
      Perfect for testing your app's OAuth-style API key flow.
    </p>
    
    <div v-if="showUrl" class="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
      <code class="text-xs break-all text-gray-800 dark:text-gray-200">
        {{ authorizationUrl }}
      </code>
    </div>
  </div>
</template>
