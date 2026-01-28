<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useApolloClient } from '@vue/apollo-composable';

import { parse } from 'graphql';

import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { useUpgradeOnboardingStore } from '~/components/Activation/store/upgradeOnboarding';
import { RegistrationState } from '~/composables/gql/graphql';

const activationModalStore = useActivationCodeModalStore();
const upgradeOnboardingStore = useUpgradeOnboardingStore();
const activationCodeStore = useActivationCodeDataStore();

const apolloClient = useApolloClient().client;

const { hasActivationCode, isFreshInstall, partnerInfo, registrationState } =
  storeToRefs(activationCodeStore);
const { currentVersion, previousVersion, isUpgrade, isCompleted } = storeToRefs(upgradeOnboardingStore);

const draftJson = ref('');
const errorMessage = ref('');
const lastApplied = ref('');
const activePresetId = ref<string | null>(null);

const SET_ONBOARDING_OVERRIDE_MUTATION = parse(/* GraphQL */ `
  mutation SetOnboardingOverride($input: OnboardingOverrideInput!) {
    onboarding {
      setOnboardingOverride(input: $input) {
        isUpgrade
        previousVersion
        currentVersion
        completed
      }
    }
  }
`);

const CLEAR_ONBOARDING_OVERRIDE_MUTATION = parse(/* GraphQL */ `
  mutation ClearOnboardingOverride {
    onboarding {
      clearOnboardingOverride {
        isUpgrade
        previousVersion
        currentVersion
        completed
      }
    }
  }
`);

type OnboardingOverridePayload = {
  activationOnboarding?: {
    currentVersion?: string | null;
    previousVersion?: string | null;
    isUpgrade?: boolean;
    completed?: boolean;
  };
  activationCode?: {
    code?: string;
    partnerName?: string;
    partnerUrl?: string;
    serverName?: string;
    sysModel?: string;
    theme?: 'azure' | 'black' | 'gray' | 'white';
  } | null;
  partnerInfo?: {
    hasPartnerLogo?: boolean | null;
    partnerName?: string | null;
    partnerUrl?: string | null;
    partnerLogoUrl?: string | null;
  } | null;
  registrationState?: RegistrationState;
  isInitialSetup?: boolean;
};

type Preset = {
  id: string;
  label: string;
  description: string;
  overrides: OnboardingOverridePayload;
};

// Made reactive to allow adding new presets in session
const presets = ref<Preset[]>([
  // ============ REGULAR USER STATES ============
  {
    id: 'regular-first-time',
    label: '1. Regular User - First Time',
    description: 'Fresh install, no partner, onboarding not completed',
    overrides: {
      registrationState: RegistrationState.ENOKEYFILE,
      activationOnboarding: {
        currentVersion: '7.0.0',
        previousVersion: null,
        isUpgrade: false,
        completed: false,
      },
      activationCode: null,
      partnerInfo: null,
      isInitialSetup: true,
    },
  },
  {
    id: 'regular-upgrading',
    label: '2. Regular User - Upgrading',
    description: 'Upgraded from 6.12.0 to 7.0.0, onboarding not completed',
    overrides: {
      registrationState: RegistrationState.ENOKEYFILE,
      activationOnboarding: {
        currentVersion: '7.0.0',
        previousVersion: '6.12.0',
        isUpgrade: true,
        completed: false,
      },
      activationCode: null,
      partnerInfo: null,
      isInitialSetup: false,
    },
  },
  {
    id: 'regular-incomplete',
    label: '3. Regular User - Incomplete Setup',
    description: 'Started onboarding but not completed, modal should reopen',
    overrides: {
      registrationState: RegistrationState.ENOKEYFILE,
      activationOnboarding: {
        currentVersion: '7.0.0',
        previousVersion: null,
        isUpgrade: false,
        completed: false,
      },
      activationCode: null,
      partnerInfo: null,
      isInitialSetup: true,
    },
  },

  // ============ PARTNER USER STATES (e.g., 45Drives) ============
  {
    id: 'partner-first-time',
    label: '4. Partner User - First Time',
    description: 'Fresh partner install with activation code, shows activation step',
    overrides: {
      registrationState: RegistrationState.ENOKEYFILE,
      activationOnboarding: {
        currentVersion: '7.0.0',
        previousVersion: null,
        isUpgrade: false,
        completed: false,
      },
      activationCode: {
        code: 'DEMO-PARTNER-CODE-123',
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        serverName: 'Storinator S45',
        sysModel: 'Storinator',
        theme: 'azure',
      },
      partnerInfo: {
        hasPartnerLogo: true,
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        partnerLogoUrl: '/config/activate/45drives-logo.png',
      },
      isInitialSetup: true,
    },
  },
  {
    id: 'partner-upgrading',
    label: '5. Partner User - Upgrading',
    description: 'Partner user upgrading from 6.12.0, shows activation step',
    overrides: {
      registrationState: RegistrationState.ENOKEYFILE,
      activationOnboarding: {
        currentVersion: '7.0.0',
        previousVersion: '6.12.0',
        isUpgrade: true,
        completed: false,
      },
      activationCode: {
        code: 'DEMO-PARTNER-CODE-456',
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        serverName: 'Storinator AV15',
        sysModel: 'Storinator',
        theme: 'azure',
      },
      partnerInfo: {
        hasPartnerLogo: true,
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        partnerLogoUrl: '/config/activate/45drives-logo.png',
      },
      isInitialSetup: false,
    },
  },
  {
    id: 'partner-incomplete',
    label: '6. Partner User - Incomplete Setup',
    description: 'Partner user started onboarding but not completed',
    overrides: {
      registrationState: RegistrationState.ENOKEYFILE,
      activationOnboarding: {
        currentVersion: '7.0.0',
        previousVersion: null,
        isUpgrade: false,
        completed: false,
      },
      activationCode: {
        code: 'DEMO-PARTNER-CODE-789',
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        serverName: 'Storinator Q30',
        sysModel: 'Storinator',
        theme: 'azure',
      },
      partnerInfo: {
        hasPartnerLogo: true,
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        partnerLogoUrl: '/config/activate/45drives-logo.png',
      },
      isInitialSetup: true,
    },
  },
]);

const formattedOverrides = (value: OnboardingOverridePayload | null) => {
  if (!value) return '';
  return JSON.stringify(value, null, 2);
};

// "Load" the preset into the editor (for editing) - and set as active selection
const loadPreset = (preset: Preset) => {
  draftJson.value = formattedOverrides(preset.overrides);
  errorMessage.value = '';
  activePresetId.value = preset.id;
};

// Apply preset directly - Acts as "Activate"
const applyAndOpenPreset = async (preset: Preset) => {
  activePresetId.value = preset.id;
  draftJson.value = formattedOverrides(preset.overrides);
  errorMessage.value = '';
  await applyOverrides();
  // Force open modal
  setTimeout(() => activationModalStore.setIsHidden(false), 100);
};

const clearOverrides = async () => {
  await apolloClient.mutate({
    mutation: CLEAR_ONBOARDING_OVERRIDE_MUTATION,
    fetchPolicy: 'no-cache',
  });
  lastApplied.value = '';
  activePresetId.value = null; // Clear active state
  await apolloClient.refetchQueries({
    include: ['ActivationCode', 'PublicWelcomeData', 'ActivationOnboarding'],
  });
};

const applyOverrides = async () => {
  const trimmed = draftJson.value.trim();
  if (!trimmed) {
    await clearOverrides();
    errorMessage.value = '';
    return;
  }

  try {
    const parsed = JSON.parse(trimmed) as OnboardingOverridePayload;
    await apolloClient.mutate({
      mutation: SET_ONBOARDING_OVERRIDE_MUTATION,
      variables: { input: parsed },
      fetchPolicy: 'no-cache',
    });
    lastApplied.value = trimmed;
    await apolloClient.refetchQueries({
      include: ['ActivationCode', 'PublicWelcomeData', 'ActivationOnboarding'],
    });
    errorMessage.value = '';

    // Auto-open modal if configuration suggests it should be open
    if (!parsed.activationOnboarding?.completed) {
      setTimeout(() => activationModalStore.setIsHidden(false), 100);
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON payload';
  }
};

const createPresetFromCurrent = () => {
  const trimmed = draftJson.value.trim();
  if (!trimmed) {
    errorMessage.value = 'Cannot create preset from empty configuration';
    return;
  }

  try {
    const parsed = JSON.parse(trimmed) as OnboardingOverridePayload;
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      label: `Custom Preset ${presets.value.length + 1}`,
      description: 'Created from current editor state',
      overrides: parsed,
    };
    presets.value.push(newPreset);
    activePresetId.value = newPreset.id;

    // Log to console for version control tracing
    console.info('New Preset Created. Copy the object below to add to source code:', newPreset);
    alert('Preset added to list! Check browser console to copy the JSON for version control.');
  } catch (error) {
    errorMessage.value = 'Invalid JSON, cannot create preset.';
  }
};
</script>

<template>
  <div class="bg-background text-foreground flex h-full max-h-screen flex-col gap-6 overflow-hidden p-6">
    <!-- Current State Panel -->
    <div class="border-border bg-card shrink-0 rounded-lg border p-5 shadow-sm">
      <div class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <div class="flex gap-2">
            <span
              v-if="isCompleted"
              class="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400"
              >Status: Completed</span
            >
            <span
              v-else
              class="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400"
              >Status: In Progress</span
            >
          </div>
        </div>
        <h2 class="text-muted-foreground text-xs font-bold tracking-wider uppercase">Current State</h2>
      </div>

      <div class="grid grid-cols-1 gap-6 text-sm md:grid-cols-4">
        <!-- Registration -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            Configuration context
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Initial Setup:</span>
            <span
              class="font-mono text-xs"
              :class="
                isFreshInstall
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-blue-600 dark:text-blue-400'
              "
              >{{ isFreshInstall }}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Reg State:</span>
            <span class="font-mono text-xs">{{ registrationState || 'N/A' }}</span>
          </div>
        </div>

        <!-- Versioning -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            Versioning
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Current:</span>
            <span class="font-mono text-xs">{{ currentVersion || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Previous:</span>
            <span class="font-mono text-xs">{{ previousVersion || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Upgrade?:</span>
            <span
              class="font-mono text-xs font-bold"
              :class="isUpgrade ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'"
              >{{ isUpgrade }}</span
            >
          </div>
        </div>

        <!-- Partner -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            Partner Data
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Has Activation Code:</span>
            <span class="font-mono text-xs">{{ hasActivationCode }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Partner:</span>
            <span class="font-mono text-xs">{{ partnerInfo?.partnerName || '-' }}</span>
          </div>
        </div>

        <!-- System -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            System
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Logo:</span>
            <span class="font-mono text-xs">{{
              partnerInfo?.hasPartnerLogo ? 'Custom' : 'Default'
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Area -->
    <div class="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Presets List (Left) -->
      <div class="border-border bg-card flex min-h-0 flex-col rounded-lg border shadow-sm lg:col-span-4">
        <div class="border-border bg-muted flex items-center justify-between rounded-t-lg border-b p-3">
          <h3 class="text-sm font-semibold">Quick Presets</h3>
          <div class="flex items-center gap-2">
            <button
              @click="activationModalStore.setIsHidden(false)"
              class="border-primary bg-primary/10 text-primary hover:bg-primary/20 rounded border px-2 py-0.5 text-xs font-medium"
            >
              Open Onboarding Modal
            </button>
            <button
              @click="createPresetFromCurrent"
              class="text-primary hover:text-primary/80 text-xs font-medium hover:underline"
              title="Create from current editor JSON"
            >
              + Add Custom
            </button>
          </div>
        </div>

        <div class="flex-1 space-y-2 overflow-y-auto p-3">
          <div
            v-for="preset in presets"
            :key="preset.id"
            class="group hover:bg-muted flex flex-col gap-2 rounded border p-3 transition-colors"
            :class="
              activePresetId === preset.id
                ? 'border-primary bg-primary/5 ring-primary ring-1'
                : 'border-border'
            "
            @click="loadPreset(preset)"
          >
            <div>
              <div class="text-foreground text-sm font-medium">{{ preset.label }}</div>
              <div class="text-muted-foreground text-xs">{{ preset.description }}</div>
            </div>
            <div class="mt-1 flex gap-2">
              <button
                @click.stop="applyAndOpenPreset(preset)"
                class="bg-primary text-primary-foreground flex-1 rounded px-2 py-1 text-xs font-medium shadow-sm hover:opacity-90"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- JSON Editor (Right) -->
      <div class="border-border bg-card flex min-h-0 flex-col rounded-lg border shadow-sm lg:col-span-8">
        <div class="border-border bg-muted flex items-center justify-between rounded-t-lg border-b p-3">
          <h3 class="text-sm font-semibold">Overrides JSON</h3>
          <div class="flex gap-2">
            <button
              @click="clearOverrides"
              class="rounded border border-transparent px-3 py-1 text-xs font-medium text-red-600 hover:border-red-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Clear
            </button>
            <button
              @click="applyOverrides"
              class="bg-primary text-primary-foreground rounded px-3 py-1 text-xs font-medium shadow-sm transition-opacity hover:opacity-90"
            >
              Apply Changes
            </button>
          </div>
        </div>

        <div class="relative flex-1">
          <textarea
            v-model="draftJson"
            class="absolute inset-0 h-full w-full resize-none bg-black p-4 font-mono text-xs text-gray-300 focus:outline-none"
            placeholder="// Paste overrides JSON here..."
          />
        </div>

        <div
          v-if="errorMessage"
          class="border-t border-red-500/20 bg-red-500/10 p-2 font-mono text-xs break-all text-red-600 dark:text-red-400"
        >
          {{ errorMessage }}
        </div>
        <div
          v-else-if="lastApplied"
          class="flex items-center justify-between border-t border-green-500/20 bg-green-500/10 p-2 text-xs text-green-600 dark:text-green-400"
        >
          <span>✓ Configuration applied</span>
          <span class="text-xs opacity-75">Modified just now</span>
        </div>
      </div>
    </div>
  </div>
</template>
