<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button, Input, Switch } from '@unraid/ui';
import { ClipboardDocumentIcon, LinkIcon } from '@heroicons/vue/24/outline';
import { generateAuthorizationUrl } from '~/utils/authorizationLink';
import { useClipboardWithToast } from '~/composables/useClipboardWithToast';
import type { Role, AuthAction } from '~/composables/gql/graphql';

interface RawPermission {
  resource: string;
  actions: AuthAction[];
}

interface Props {
  roles?: Role[];
  rawPermissions?: RawPermission[];
  appName?: string;
  appDescription?: string;
  redirectUrl?: string;
  show?: boolean;
  isAuthorizationMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  roles: () => [],
  rawPermissions: () => [],
  appName: 'CliInternal',
  appDescription: '',
  redirectUrl: '',
  show: true,
  isAuthorizationMode: false,
});

// State for UI interactions
const copySuccess = ref(false);
const copyTemplateSuccess = ref(false);
const showUrl = ref(false);
const showTemplate = ref(false);
const useCustomCallback = ref(false);
const customCallbackUrl = ref('');

// Use clipboard composable
const { copyWithNotification } = useClipboardWithToast();

// Reset custom callback URL when checkbox is unchecked
watch(useCustomCallback, (newValue) => {
  if (!newValue) {
    customCallbackUrl.value = '';
  }
});

// Computed property for the effective redirect URL
const effectiveRedirectUrl = computed(() => {
  if (useCustomCallback.value && customCallbackUrl.value) {
    return customCallbackUrl.value;
  }
  return props.redirectUrl;
});

// Computed property for authorization URL
const authorizationUrl = computed(() => {
  if (!props.show) {
    return '';
  }
  
  return generateAuthorizationUrl({
    appName: props.appName,
    appDescription: props.appDescription,
    roles: props.roles,
    rawPermissions: props.rawPermissions,
    redirectUrl: effectiveRedirectUrl.value,
  });
});

// Computed property for template query string (without redirect_uri)
const templateQueryString = computed(() => {
  if (!props.show) {
    return '';
  }
  
  // Generate URL without redirect_uri for template sharing
  const url = generateAuthorizationUrl({
    appName: props.appName,
    appDescription: props.appDescription,
    roles: props.roles,
    rawPermissions: props.rawPermissions,
    redirectUrl: '', // Empty redirect URL for templates
  });
  
  // Extract just the query string part
  const urlObj = new URL(url, window.location.origin);
  const params = new URLSearchParams(urlObj.search);
  params.delete('redirect_uri'); // Remove redirect_uri from template
  
  return '?' + params.toString();
});

// Check if there are any permissions to show
const hasPermissions = computed(() => {
  return props.roles.length > 0 || props.rawPermissions.length > 0;
});

// Function to copy authorization URL
const handleCopy = async () => {
  const success = await copyWithNotification(
    authorizationUrl.value,
    'Authorization URL copied to clipboard'
  );
  
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
  showTemplate.value = false; // Hide template when showing URL
};

// Function to toggle template visibility
const toggleShowTemplate = () => {
  showTemplate.value = !showTemplate.value;
  showUrl.value = false; // Hide URL when showing template
};

// Function to copy template query string
const copyTemplate = async () => {
  const success = await copyWithNotification(
    templateQueryString.value,
    'Template copied to clipboard'
  );
  
  if (success) {
    copyTemplateSuccess.value = true;
    setTimeout(() => {
      copyTemplateSuccess.value = false;
    }, 2000);
  }
};
</script>

<template>
  <div v-if="show" class="space-y-3">
    <div>
      <h4 class="text-sm font-medium mb-2">Developer Authorization Link</h4>
      <div v-if="!hasPermissions" class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-3">
        <p class="text-sm text-amber-800 dark:text-amber-200">
          No permissions selected. Add roles or permissions above to generate an authorization link.
        </p>
      </div>
      <div v-else class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" @click="toggleShowUrl">
          <LinkIcon class="w-4 h-4 mr-1" />
          {{ showUrl ? 'Hide' : 'Show' }} URL
        </Button>
        <Button variant="outline" size="sm" @click="handleCopy">
          <ClipboardDocumentIcon class="w-4 h-4 mr-1" />
          {{ copySuccess ? 'Copied!' : 'Copy URL' }}
        </Button>
        <Button variant="outline" size="sm" @click="toggleShowTemplate">
          <LinkIcon class="w-4 h-4 mr-1" />
          {{ showTemplate ? 'Hide' : 'Show' }} Template
        </Button>
        <Button variant="outline" size="sm" @click="copyTemplate">
          <ClipboardDocumentIcon class="w-4 h-4 mr-1" />
          {{ copyTemplateSuccess ? 'Copied!' : 'Copy Template' }}
        </Button>
      </div>
    </div>
    
    <p v-if="hasPermissions" class="text-sm text-muted-foreground">
      Use this link to create an API key authorization for <strong>{{ appName }}</strong> with the selected permissions. 
      Perfect for testing your app's OAuth-style API key flow.
    </p>
    
    <div v-if="!isAuthorizationMode" class="flex items-center gap-2 mt-3">
      <Switch 
        id="custom-callback" 
        v-model="useCustomCallback"
      />
      <label for="custom-callback" class="text-sm font-medium cursor-pointer">
        Use custom callback URL
      </label>
    </div>
    
    <div v-if="!isAuthorizationMode && useCustomCallback" class="mt-2">
      <Input
        v-model="customCallbackUrl"
        type="url"
        placeholder="https://example.com/callback"
        class="w-full"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Enter the URL where users will be redirected after authorization
      </p>
    </div>
    
    <div v-if="showUrl" class="p-3 bg-secondary rounded border border-muted mt-3">
      <p class="text-xs text-muted-foreground mb-2">Full authorization URL with callback:</p>
      <code class="text-xs break-all text-foreground">
        {{ authorizationUrl }}
      </code>
    </div>
    
    <div v-if="showTemplate" class="p-3 bg-secondary rounded border border-muted mt-3">
      <p class="text-xs text-muted-foreground mb-2">Template query string (for sharing without callback):</p>
      <code class="text-xs break-all text-foreground">
        {{ templateQueryString }}
      </code>
      <p class="text-xs text-muted-foreground mt-2">
        This template can be used with "Create from Template" to pre-fill permissions without a callback URL.
      </p>
    </div>
  </div>
</template>
