<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button } from '@unraid/ui';
import { ClipboardDocumentIcon, LinkIcon, CodeBracketIcon } from '@heroicons/vue/24/outline';
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
  appName: 'My App',
  appDescription: 'A sample application',
  redirectUrl: '',
  show: true,
});

// State for UI interactions
const copySuccess = ref(false);
const showLink = ref(false);

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
const handleCopyAuthorizationUrl = async () => {
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

// Function to toggle link visibility
const toggleLinkVisibility = () => {
  showLink.value = !showLink.value;
};

// Function to open link in new tab
const openInNewTab = () => {
  if (authorizationUrl.value) {
    window.open(authorizationUrl.value, '_blank');
  }
};
</script>

<template>
  <div v-if="show && hasPermissions" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
        <CodeBracketIcon class="w-4 h-4" />
        Developer Authorization Link
      </h4>
      <div class="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          @click="toggleLinkVisibility"
        >
          <LinkIcon class="w-4 h-4 mr-1" />
          {{ showLink ? 'Hide' : 'Show' }} URL
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          :class="copySuccess 
            ? 'text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50' 
            : 'text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'"
          @click="handleCopyAuthorizationUrl"
        >
          <ClipboardDocumentIcon class="w-4 h-4 mr-1" />
          {{ copySuccess ? 'Copied!' : 'Copy' }}
        </Button>
      </div>
    </div>
    
    <p class="text-xs text-blue-800 dark:text-blue-200 mb-3">
      Use this link to create an API key authorization for <strong>{{ appName }}</strong> with the selected permissions. 
      Perfect for testing your app's OAuth-style API key flow.
    </p>
    
    <!-- Quick action buttons -->
    <div class="flex flex-wrap gap-2 mb-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
        @click="openInNewTab"
      >
        <LinkIcon class="w-4 h-4 mr-1" />
        Open Authorization Page
      </Button>
    </div>
    
    <!-- Authorization URL Display -->
    <div v-if="showLink" class="space-y-2">
      <div class="p-3 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-700">
        <div class="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Authorization URL:</div>
        <code class="text-xs break-all text-gray-800 dark:text-gray-200 leading-relaxed">
          {{ authorizationUrl }}
        </code>
      </div>
      
      <div class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
        <p><strong>How to use:</strong></p>
        <ol class="list-decimal list-inside space-y-1 ml-2">
          <li>Navigate to this URL (or click "Open Authorization Page")</li>
          <li>Review the requested permissions</li>
          <li>Click "Authorize" to create the API key</li>
          <li>The API key will be returned to your application</li>
        </ol>
      </div>
    </div>
    
    <!-- Permissions Summary -->
    <div class="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
      <div class="text-xs text-blue-800 dark:text-blue-200 font-medium mb-2">Permissions to be granted:</div>
      <div class="flex flex-wrap gap-1">
        <span 
          v-for="role in roles" 
          :key="`role-${role}`"
          class="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded text-xs"
        >
          Role: {{ role }}
        </span>
        <span 
          v-for="perm in rawPermissions" 
          :key="`perm-${perm.resource}`"
          class="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded text-xs"
        >
          {{ perm.resource }}: {{ perm.actions.join(', ') }}
        </span>
      </div>
      <div v-if="roles.length === 0 && rawPermissions.length === 0" class="text-xs text-blue-700 dark:text-blue-300 italic">
        No specific permissions selected
      </div>
    </div>
  </div>
</template>
