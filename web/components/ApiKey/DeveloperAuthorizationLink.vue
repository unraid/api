<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button, Input, Switch } from '@unraid/ui';
import { ClipboardDocumentIcon, LinkIcon } from '@heroicons/vue/24/outline';
import { generateAuthorizationUrl, copyAuthorizationUrl } from '~/utils/authorizationLink';
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
const showUrl = ref(false);
const useCustomCallback = ref(false);
const customCallbackUrl = ref('');

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
  if (!props.show || (props.roles.length === 0 && props.rawPermissions.length === 0)) {
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
    redirectUrl: effectiveRedirectUrl.value,
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
    
    <p class="text-sm text-muted-foreground">
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
      <code class="text-xs break-all text-foreground">
        {{ authorizationUrl }}
      </code>
    </div>
  </div>
</template>
