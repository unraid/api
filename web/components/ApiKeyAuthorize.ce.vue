<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button, Input } from '@unraid/ui';
import { useClipboardWithToast } from '~/composables/useClipboardWithToast.js';
import { ClipboardDocumentIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';
import { storeToRefs } from 'pinia';
import { useAuthorizationLink } from '~/composables/useAuthorizationLink.js';
import { useApiKeyStore } from '~/store/apiKey.js';

// Use the composables for authorization logic
const {
  authParams,
  hasValidRedirectUri,
  buildCallbackUrl,
  formData: authorizationFormData,
  displayAppName,
  hasPermissions,
  permissionsSummary,
} = useAuthorizationLink();

// Use the API key store to control the global modal
const apiKeyStore = useApiKeyStore();
const { createdKey, modalVisible } = storeToRefs(apiKeyStore);

// Component state
const showSuccess = ref(false);
const createdApiKey = ref('');
const error = ref('');
const showKey = ref(false);

// Use clipboard for copying
const { copyWithNotification, copied } = useClipboardWithToast();

// Watch for modal close to restore success view
watch(modalVisible, (isVisible) => {
  if (!isVisible && createdKey.value && createdApiKey.value) {
    // Modal was closed, restore success view after editing
    showSuccess.value = true;
  }
});

// Toggle key visibility
const toggleShowKey = () => {
  showKey.value = !showKey.value;
};

// Copy API key
const copyApiKey = async () => {
  if (createdApiKey.value) {
    await copyWithNotification(createdApiKey.value, 'API key copied to clipboard');
  }
};

// Open the authorization modal
const openAuthorizationModal = () => {
  // Set up authorization parameters in the store
  apiKeyStore.setAuthorizationMode(
    authParams.value.name,
    authParams.value.description || `API key for ${displayAppName.value}`,
    authParams.value.scopes,
    handleAuthorize,
    authorizationFormData.value
  );
  
  // Show the modal
  apiKeyStore.showModal();
};

// Handle authorization success
const handleAuthorize = (apiKey: string) => {
  createdApiKey.value = apiKey;
  showSuccess.value = true;
  apiKeyStore.hideModal();
  
  // No automatic redirect - user must click the button
};

// Open the edit modal for the created key
const modifyApiKey = () => {
  if (createdKey.value) {
    // Open the modal in edit mode with the created key
    apiKeyStore.showModal(createdKey.value);
    // Don't clear states - the watchers will handle the flow
  }
};

// Handle denial
const deny = () => {
  if (hasValidRedirectUri.value) {
    try {
      const url = buildCallbackUrl(undefined, 'access_denied');
      window.location.href = url;
    } catch {
      window.location.href = '/';
    }
  } else {
    window.location.href = '/';
  }
};

// Return to app with API key
const returnToApp = () => {
  if (!hasValidRedirectUri.value || !createdApiKey.value) return;
  
  try {
    const url = buildCallbackUrl(createdApiKey.value, undefined);
    window.location.href = url;
  } catch (_err) {
    error.value = 'Failed to redirect back to application';
  }
};
</script>

<template>
  <div class="w-full max-w-4xl mx-auto p-6">
    <!-- Success state -->
    <div v-if="showSuccess && createdApiKey" class="w-full bg-background rounded-lg shadow-sm border border-muted">
      <!-- Header -->
      <div class="p-6 pb-4 border-b border-muted">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
            <svg class="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold">API Key Created Successfully</h3>
            <p class="text-sm text-muted-foreground">
              Your API key for <strong>{{ displayAppName }}</strong> has been created
            </p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4">
        <!-- API Key section -->
        <div>
          <label class="text-sm font-medium text-muted-foreground mb-2 block">Generated API Key</label>
          <div class="p-3 bg-secondary rounded-lg">
            <div class="flex gap-2 mb-2">
              <div class="relative flex-1">
                <Input
                  :model-value="showKey ? createdApiKey : '••••••••••••••••••••••••••••••••'"
                  class="font-mono text-sm pr-10 bg-background"
                  readonly
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-2 flex items-center px-1 text-muted-foreground hover:text-foreground"
                  @click="toggleShowKey"
                >
                  <component :is="showKey ? EyeSlashIcon : EyeIcon" class="w-4 h-4" />
                </button>
              </div>
              <Button
                variant="outline"
                size="icon"
                @click="copyApiKey"
              >
                <ClipboardDocumentIcon class="w-4 h-4" />
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ copied ? '✓ Copied to clipboard' : hasValidRedirectUri ? 'Save this key securely for your application.' : 'Save this key securely. You can now use it in your application.' }}
            </p>
          </div>
        </div>

        <!-- Redirect info if available, or template info -->
        <div v-if="hasValidRedirectUri">
          <label class="text-sm font-medium text-muted-foreground mb-2 block">Next Step</label>
          <div class="p-3 bg-secondary rounded-lg">
            <p class="text-sm">
              Send this API key to complete the authorization
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              Destination: <code class="bg-background px-1.5 py-0.5 rounded">{{ authParams.redirectUri }}</code>
            </p>
          </div>
        </div>
        <div v-else>
          <label class="text-sm font-medium text-muted-foreground mb-2 block">Template Applied</label>
          <div class="p-3 bg-secondary rounded-lg">
            <p class="text-sm">
              API key created from template with the configured permissions
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              You can manage this key from the API Keys settings page
            </p>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="p-6 pt-2 flex gap-3">
        <Button
          variant="outline"
          class="flex-1"
          @click="modifyApiKey"
        >
          Modify API Key
        </Button>
        <Button
          v-if="hasValidRedirectUri"
          variant="primary"
          class="flex-1"
          @click="returnToApp"
        >
          Send Key to {{ authParams.name }}
        </Button>
      </div>
    </div>

    <!-- Authorization form using ApiKeyCreate component -->
    <div v-else class="w-full bg-background rounded-lg shadow-sm border border-muted">
      <!-- Header -->
      <div class="p-6 pb-4 border-b border-muted">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <svg class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold">{{ hasValidRedirectUri ? 'API Key Authorization Request' : 'Create API Key from Template' }}</h3>
            <p class="text-sm text-muted-foreground">
              <span v-if="hasValidRedirectUri">
                <strong>{{ displayAppName }}</strong> is requesting API access to your Unraid server
              </span>
              <span v-else>
                Create an API key for <strong>{{ displayAppName }}</strong> with pre-configured permissions
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4">
        <!-- Permissions section -->
        <div>
          <label class="text-sm font-medium text-muted-foreground mb-2 block">
            {{ hasValidRedirectUri ? 'Requested Permissions' : 'Template Permissions' }}
          </label>
          <div v-if="hasPermissions" class="p-3 bg-secondary rounded-lg">
            <p class="text-sm">{{ permissionsSummary }}</p>
          </div>
          <div v-else class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <span v-if="hasValidRedirectUri">
                No specific permissions requested. The application may be requesting basic access.
              </span>
              <span v-else>
                No specific permissions defined in this template.
              </span>
            </p>
          </div>
        </div>
        
        <!-- Redirect info if available -->
        <div v-if="hasValidRedirectUri">
          <label class="text-sm font-medium text-muted-foreground mb-2 block">After Authorization</label>
          <div class="p-3 bg-secondary rounded-lg">
            <p class="text-sm">
              You will need to confirm and send the API key to the application
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              Destination: <code class="bg-background px-1.5 py-0.5 rounded">{{ authParams.redirectUri }}</code>
            </p>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="p-6 pt-2 flex gap-3">
        <Button
          variant="outline"
          class="flex-1"
          @click="deny"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          class="flex-1"
          @click="openAuthorizationModal"
        >
          {{ hasValidRedirectUri ? 'Review Permissions & Authorize' : 'Review Permissions' }}
        </Button>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-red-800 dark:text-red-200">{{ error }}</p>
    </div>
  </div>
</template>
