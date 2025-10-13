<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { Button, Label, Switch } from '@unraid/ui';

import type { ServerState, ServerUpdateOsResponse } from '~/types/server';

import CheckUpdateResponseModal from '~/components/UpdateOs/CheckUpdateResponseModal.vue';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

const { t } = useI18n();
const updateOsStore = useUpdateOsStore();
const serverStore = useServerStore();

// Test scenarios
const testScenarios = [
  {
    id: 'expired-ineligible',
    name: 'Expired key with ineligible update',
    description: 'License expired, update available but not eligible',
    serverState: 'EEXPIRED' as ServerState,
    updateResponse: {
      version: '7.1.0',
      name: 'Unraid 7.1.0',
      date: '2024-12-15',
      isNewer: true,
      isEligible: false,
      changelog:
        'https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/7.1.0.md',
      changelogPretty: 'https://docs.unraid.net/unraid-os/release-notes/7.1.0/',
      sha256: undefined, // requires auth
    },
  },
  {
    id: 'normal-update',
    name: 'Normal update available',
    description: 'Active license with eligible update',
    serverState: 'BASIC' as ServerState,
    updateResponse: {
      version: '7.1.0',
      name: 'Unraid 7.1.0',
      date: '2024-12-15',
      isNewer: true,
      isEligible: true,
      changelog:
        'https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/7.1.0.md',
      changelogPretty: 'https://docs.unraid.net/unraid-os/release-notes/7.1.0/',
      sha256: 'abc123def456789',
    },
  },
  {
    id: 'renewal-required',
    name: 'Update requires renewal',
    description: 'License expired > 1 year, update requires renewal',
    serverState: 'STARTER' as ServerState,
    updateResponse: {
      version: '7.1.0',
      name: 'Unraid 7.1.0',
      date: '2024-12-15',
      isNewer: true,
      isEligible: false,
      changelog:
        'https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/7.1.0.md',
      changelogPretty: 'https://docs.unraid.net/unraid-os/release-notes/7.1.0/',
      sha256: undefined,
    },
  },
  {
    id: 'no-update',
    name: 'No update available',
    description: 'Already on latest version',
    serverState: 'BASIC' as ServerState,
    updateResponse: {
      version: '7.0.0',
      name: 'Unraid 7.0.0',
      date: '2024-01-15',
      isNewer: false,
      isEligible: true,
      changelog:
        'https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/7.0.0.md',
      sha256: 'xyz789abc123',
    },
  },
  {
    id: 'trial-update',
    name: 'Trial with update',
    description: 'Trial license with update available',
    serverState: 'TRIAL' as ServerState,
    updateResponse: {
      version: '7.1.0',
      name: 'Unraid 7.1.0',
      date: '2024-12-15',
      isNewer: true,
      isEligible: true,
      changelog: 'https://docs.unraid.net/unraid-os/release-notes/7.1.0/',
      sha256: 'def456ghi789',
    },
  },
  {
    id: 'pro-auth-required',
    name: 'Pro license - auth required',
    description: 'Pro license but authentication required for download',
    serverState: 'PRO' as ServerState,
    updateResponse: {
      version: '7.1.0',
      name: 'Unraid 7.1.0',
      date: '2024-12-15',
      isNewer: true,
      isEligible: true,
      changelog: 'https://docs.unraid.net/unraid-os/release-notes/7.1.0/',
      sha256: undefined, // requires auth
    },
  },
];

// Component state
const selectedScenario = ref('normal-update');
const ignoreRelease = ref(false);
const checkingForUpdates = ref(false);
const ignoredReleases = ref<string[]>([]);

// Use the store's modal state directly
const modalOpen = computed({
  get: () => updateOsStore.updateOsModalVisible,
  set: (value) => updateOsStore.setModalOpen(value),
});

// Apply scenario
const applyScenario = () => {
  const scenario = testScenarios.find((s) => s.id === selectedScenario.value);
  if (!scenario) return;

  // Set server state
  const currentTime = Date.now();
  const expiredTime = scenario.serverState === 'EEXPIRED' ? currentTime - 24 * 60 * 60 * 1000 : 0;
  const regExp =
    scenario.serverState === 'STARTER' ? currentTime - 400 * 24 * 60 * 60 * 1000 : undefined;

  // Apply update response
  if (scenario.serverState === 'EEXPIRED') {
    serverStore.$patch({
      expireTime: expiredTime,
      state: scenario.serverState,
      regExp: undefined,
    });
  } else if (scenario.serverState === 'STARTER') {
    serverStore.$patch({
      state: scenario.serverState,
      regExp: regExp,
      regTy: 'Starter',
    });
  } else {
    serverStore.$patch({
      state: scenario.serverState,
      regExp: undefined,
      expireTime: scenario.serverState === 'TRIAL' ? currentTime + 7 * 24 * 60 * 60 * 1000 : 0,
    });
  }

  serverStore.setUpdateOsResponse(scenario.updateResponse as ServerUpdateOsResponse);

  // Apply ignored releases
  if (ignoreRelease.value && scenario.updateResponse.isNewer) {
    if (!ignoredReleases.value.includes(scenario.updateResponse.version)) {
      ignoredReleases.value.push(scenario.updateResponse.version);
    }
  } else {
    ignoredReleases.value = ignoredReleases.value.filter((v) => v !== scenario.updateResponse.version);
  }
  serverStore.$patch({ updateOsIgnoredReleases: ignoredReleases.value });
};

// Watch for scenario changes
watch([selectedScenario, ignoreRelease], () => {
  applyScenario();
});

// Watch for loading state changes
watch(checkingForUpdates, (value) => {
  updateOsStore.checkForUpdatesLoading = value;
});

// Open modal with scenario
const openModal = () => {
  applyScenario();
  updateOsStore.checkForUpdatesLoading = checkingForUpdates.value;
  updateOsStore.setModalOpen(true);
};

// Initialize
applyScenario();

const currentScenario = computed(() => testScenarios.find((s) => s.id === selectedScenario.value));
</script>

<template>
  <div class="container mx-auto max-w-4xl p-6">
    <div class="rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
      <div class="mb-6">
        <h2 class="mb-2 text-2xl font-bold">Update Modal Test Page</h2>
        <p class="text-muted-foreground">
          Test various update scenarios for the CheckUpdateResponseModal component
        </p>
      </div>

      <div class="space-y-6">
        <!-- Scenario Selection -->
        <div class="space-y-4">
          <Label class="text-lg font-semibold">Select Test Scenario</Label>
          <div class="space-y-3">
            <div v-for="scenario in testScenarios" :key="scenario.id" class="flex items-start space-x-3">
              <input
                type="radio"
                :id="scenario.id"
                :value="scenario.id"
                v-model="selectedScenario"
                class="mt-1 rounded-full"
              />
              <div class="flex-1">
                <Label :for="scenario.id" class="block cursor-pointer font-medium">
                  {{ scenario.name }}
                </Label>
                <p class="text-muted-foreground mt-1 text-sm">{{ scenario.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="space-y-4 border-t pt-4">
          <h3 class="font-semibold">Options</h3>

          <div class="flex items-center space-x-3">
            <Switch id="ignore-release" v-model:checked="ignoreRelease" />
            <Label for="ignore-release" class="cursor-pointer">Ignore this release</Label>
          </div>

          <div class="flex items-center space-x-3">
            <Switch id="checking-updates" v-model:checked="checkingForUpdates" />
            <Label for="checking-updates" class="cursor-pointer"
              >Show checking for updates loading state</Label
            >
          </div>
        </div>

        <!-- Current State Display -->
        <div class="space-y-2 border-t pt-4">
          <h3 class="font-semibold">Current Scenario Details</h3>
          <div class="space-y-1 font-mono text-sm">
            <p><span class="font-semibold">Server State:</span> {{ currentScenario?.serverState }}</p>
            <p>
              <span class="font-semibold">Version:</span> {{ currentScenario?.updateResponse.version }}
            </p>
            <p>
              <span class="font-semibold">Is Newer:</span> {{ currentScenario?.updateResponse.isNewer }}
            </p>
            <p>
              <span class="font-semibold">Is Eligible:</span>
              {{ currentScenario?.updateResponse.isEligible }}
            </p>
            <p>
              <span class="font-semibold">Has SHA256:</span>
              {{ !!currentScenario?.updateResponse.sha256 }}
            </p>
            <p>
              <span class="font-semibold">Ignored Releases:</span>
              {{ ignoredReleases.join(', ') || 'None' }}
            </p>
          </div>
        </div>

        <!-- Open Modal Button -->
        <div class="border-t pt-4">
          <Button @click="openModal" variant="primary" class="w-full"> Open Update Modal </Button>
        </div>
      </div>
    </div>

    <!-- The Modal Component -->
    <CheckUpdateResponseModal
      :open="modalOpen"
      @update:open="
        (val: boolean) => {
          modalOpen = val;
        }
      "
    />
  </div>
</template>
