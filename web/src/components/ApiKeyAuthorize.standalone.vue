<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { ClipboardDocumentIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';
import { Button, Input } from '@unraid/ui';
import { navigate } from '~/helpers/external-navigation';

import ApiKeyCreate from '~/components/ApiKey/ApiKeyCreate.vue';
import { useAuthorizationLink } from '~/composables/useAuthorizationLink.js';
import { useClipboardWithToast } from '~/composables/useClipboardWithToast.js';
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
const { createdKey, modalVisible, isAuthorizationMode, authorizationData, editingKey } =
  storeToRefs(apiKeyStore);

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
      navigate(url);
    } catch {
      navigate('/');
    }
  } else {
    navigate('/');
  }
};

// Return to app with API key
const returnToApp = () => {
  if (!hasValidRedirectUri.value || !createdApiKey.value) return;

  try {
    const url = buildCallbackUrl(createdApiKey.value, undefined);
    navigate(url);
  } catch (_err) {
    error.value = 'Failed to redirect back to application';
  }
};
</script>

<template>
  <div class="mx-auto w-full max-w-3xl p-6">
    <!-- Success state -->
    <div
      v-if="showSuccess && createdApiKey"
      class="bg-background border-muted w-full rounded-lg border shadow-sm"
    >
      <!-- Header -->
      <div class="border-muted border-b p-6 pb-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <svg
              class="h-5 w-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold">API Key Created Successfully</h3>
            <p class="text-muted-foreground text-sm">
              Your API key for <strong>{{ displayAppName }}</strong> has been created
            </p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-4 p-6">
        <!-- API Key section -->
        <div>
          <label class="text-muted-foreground mb-2 block text-sm font-medium">Generated API Key</label>
          <div class="bg-secondary rounded-lg p-3">
            <div class="mb-2 flex gap-2">
              <div class="relative flex-1">
                <Input
                  :model-value="showKey ? createdApiKey : '••••••••••••••••••••••••••••••••'"
                  class="bg-background pr-10 font-mono text-sm"
                  readonly
                />
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-2 flex items-center px-1"
                  @click="toggleShowKey"
                >
                  <component :is="showKey ? EyeSlashIcon : EyeIcon" class="h-4 w-4" />
                </button>
              </div>
              <Button variant="outline" size="icon" @click="copyApiKey">
                <ClipboardDocumentIcon class="h-4 w-4" />
              </Button>
            </div>
            <p class="text-muted-foreground text-xs">
              {{
                copied
                  ? '✓ Copied to clipboard'
                  : hasValidRedirectUri
                    ? 'Save this key securely for your application.'
                    : 'Save this key securely. You can now use it in your application.'
              }}
            </p>
          </div>
        </div>

        <!-- Redirect info if available, or template info -->
        <div v-if="hasValidRedirectUri">
          <label class="text-muted-foreground mb-2 block text-sm font-medium">Next Step</label>
          <div class="bg-secondary rounded-lg p-3">
            <p class="text-sm">Send this API key to complete the authorization</p>
            <p class="text-muted-foreground mt-1 text-xs">
              Destination:
              <code class="bg-background rounded px-1.5 py-0.5">{{ authParams.redirectUri }}</code>
            </p>
          </div>
        </div>
        <div v-else>
          <label class="text-muted-foreground mb-2 block text-sm font-medium">Template Applied</label>
          <div class="bg-secondary rounded-lg p-3">
            <p class="text-sm">API key created from template with the configured permissions</p>
            <p class="text-muted-foreground mt-1 text-xs">
              You can manage this key from the API Keys settings page
            </p>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3 p-6 pt-2">
        <Button variant="outline" class="flex-1" @click="modifyApiKey"> Modify API Key </Button>
        <Button v-if="hasValidRedirectUri" variant="primary" class="flex-1" @click="returnToApp">
          Send Key to {{ authParams.name }}
        </Button>
      </div>
    </div>

    <!-- Authorization form using ApiKeyCreate component -->
    <div v-else class="bg-background border-muted w-full rounded-lg border shadow-sm">
      <!-- Header -->
      <div class="border-muted border-b p-6 pb-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20"
          >
            <svg
              class="h-5 w-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold">
              {{
                hasValidRedirectUri ? 'API Key Authorization Request' : 'Create API Key from Template'
              }}
            </h3>
            <p class="text-muted-foreground text-sm">
              <span v-if="hasValidRedirectUri">
                <strong>{{ displayAppName }}</strong> is requesting API access to your Unraid server
              </span>
              <span v-else>
                Create an API key for <strong>{{ displayAppName }}</strong> with pre-configured
                permissions
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-4 p-6">
        <!-- Permissions section -->
        <div>
          <label class="text-muted-foreground mb-2 block text-sm font-medium">
            {{ hasValidRedirectUri ? 'Requested Permissions' : 'Template Permissions' }}
          </label>
          <div v-if="hasPermissions" class="bg-secondary rounded-lg p-3">
            <p class="text-sm">{{ permissionsSummary }}</p>
          </div>
          <div
            v-else
            class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
          >
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <span v-if="hasValidRedirectUri">
                No specific permissions requested. The application may be requesting basic access.
              </span>
              <span v-else> No specific permissions defined in this template. </span>
            </p>
          </div>
        </div>

        <!-- Redirect info if available -->
        <div v-if="hasValidRedirectUri">
          <label class="text-muted-foreground mb-2 block text-sm font-medium">After Authorization</label>
          <div class="bg-secondary rounded-lg p-3">
            <p class="text-sm">You will need to confirm and send the API key to the application</p>
            <p class="text-muted-foreground mt-1 text-xs">
              Destination:
              <code class="bg-background rounded px-1.5 py-0.5">{{ authParams.redirectUri }}</code>
            </p>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3 p-6 pt-2">
        <Button variant="outline" class="flex-1" @click="deny"> Cancel </Button>
        <Button variant="primary" class="flex-1" @click="openAuthorizationModal">
          {{ hasValidRedirectUri ? 'Authorize' : 'Continue' }}
        </Button>
      </div>
    </div>

    <!-- Error message -->
    <div
      v-if="error"
      class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
    >
      <p class="text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <!-- API Key Create Modal (for authorization flow) -->
    <ApiKeyCreate
      :open="modalVisible"
      :editing-key="editingKey"
      :is-authorization-mode="isAuthorizationMode"
      :authorization-data="authorizationData"
      @update:open="(v) => (v ? apiKeyStore.showModal() : apiKeyStore.hideModal())"
      @created="(key) => apiKeyStore.setCreatedKey(key)"
      @updated="(key) => apiKeyStore.setCreatedKey(key)"
    />
  </div>
</template>
