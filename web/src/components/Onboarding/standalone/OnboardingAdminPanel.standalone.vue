<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useApolloClient } from '@vue/apollo-composable';

import { InformationCircleIcon } from '@heroicons/vue/24/outline';
import { parse } from 'graphql';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Onboarding/store/activationCodeModal';
import { useOnboardingStore } from '~/components/Onboarding/store/upgradeOnboarding';
import { RegistrationState } from '~/composables/gql/graphql';

const activationModalStore = useActivationCodeModalStore();
const onboardingStore = useOnboardingStore();
const activationCodeStore = useActivationCodeDataStore();

const apolloClient = useApolloClient().client;

const { hasActivationCode, isFreshInstall, partnerInfo, registrationState } =
  storeToRefs(activationCodeStore);
const {
  status,
  isPartnerBuild,
  completed,
  completedAtVersion,
  mockUnauthenticated,
  osVersion,
  effectiveOsVersion,
  isVersionSupported,
} = storeToRefs(onboardingStore);

const draftJson = ref('');
const errorMessage = ref('');
const lastApplied = ref('');
const activePresetId = ref<string | null>(null);
const resetDraftAndHardRefreshOnOpen = ref(false);
const RESET_DRAFT_AND_REFRESH_KEY = 'onboardingAdminPanel.resetDraftAndHardRefreshOnOpen';

// Cache for storing edited JSON per preset - survives switching between presets
const presetEditCache = ref<Map<string, string>>(new Map());

const SET_ONBOARDING_OVERRIDE_MUTATION = parse(/* GraphQL */ `
  mutation SetOnboardingOverride($input: OnboardingOverrideInput!) {
    onboarding {
      setOnboardingOverride(input: $input) {
        status
        isPartnerBuild
        completed
        completedAtVersion
      }
    }
  }
`);

const CLEAR_ONBOARDING_OVERRIDE_MUTATION = parse(/* GraphQL */ `
  mutation ClearOnboardingOverride {
    onboarding {
      clearOnboardingOverride {
        status
        isPartnerBuild
        completed
        completedAtVersion
      }
    }
  }
`);

type PartnerConfigPayload = {
  name?: string;
  url?: string;
  hardwareSpecsUrl?: string;
  manualUrl?: string;
  supportUrl?: string;
  extraLinks?: Array<{ title: string; url: string }>;
};

type BrandingConfigPayload = {
  header?: string;
  headermetacolor?: string;
  background?: string;
  showBannerGradient?: boolean;
  theme?: 'azure' | 'black' | 'gray' | 'white';
  partnerLogoLightUrl?: string;
  partnerLogoDarkUrl?: string;
  hasPartnerLogo?: boolean;
  onboardingTitle?: string;
  onboardingSubtitle?: string;
  onboardingTitleFreshInstall?: string;
  onboardingSubtitleFreshInstall?: string;
  onboardingTitleUpgrade?: string;
  onboardingSubtitleUpgrade?: string;
  onboardingTitleDowngrade?: string;
  onboardingSubtitleDowngrade?: string;
  onboardingTitleIncomplete?: string;
  onboardingSubtitleIncomplete?: string;
};

type SystemConfigPayload = {
  serverName?: string;
  model?: string;
  comment?: string;
};

type OnboardingOverridePayload = {
  currentVersion?: string | null;
  onboarding?: {
    completed?: boolean;
    completedAtVersion?: string | null;
  };
  activationCode?: {
    code?: string;
    partner?: PartnerConfigPayload;
    branding?: BrandingConfigPayload;
    system?: SystemConfigPayload;
  } | null;
  partnerInfo?: {
    partner?: PartnerConfigPayload;
    branding?: BrandingConfigPayload;
  } | null;
  registrationState?: RegistrationState;
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
    id: 'regular-incomplete',
    label: '1. Regular User - Incomplete',
    description: 'Incomplete onboarding state (commonly fresh install), no partner',
    overrides: {
      currentVersion: '7.3.0',
      registrationState: RegistrationState.ENOKEYFILE,
      onboarding: {
        completed: false,
        completedAtVersion: null,
      },
      activationCode: null,
      partnerInfo: null,
    },
  },
  {
    id: 'regular-upgrade',
    label: '2. Regular User - Upgrade',
    description: 'Completed onboarding on older version (7.1.0), now on 7.2.0',
    overrides: {
      currentVersion: '7.3.0',
      registrationState: RegistrationState.EGUID,
      onboarding: {
        completed: true,
        completedAtVersion: '7.1.0', // Older than current version
      },
      activationCode: null,
      partnerInfo: null,
    },
  },
  {
    id: 'regular-downgrade',
    label: '3. Regular User - Downgrade',
    description: 'Completed onboarding on newer version, now downgraded',
    overrides: {
      currentVersion: '7.3.0',
      registrationState: RegistrationState.EGUID,
      onboarding: {
        completed: true,
        completedAtVersion: '9.0.0',
      },
      activationCode: null,
      partnerInfo: null,
    },
  },
  {
    id: 'regular-completed',
    label: '4. Regular User - Completed',
    description: 'Onboarding completed state (version-agnostic)',
    overrides: {
      currentVersion: '7.3.0',
      registrationState: RegistrationState.EGUID,
      onboarding: {
        completed: true,
        completedAtVersion: null, // Null forces COMPLETED regardless of current version
      },
      activationCode: null,
      partnerInfo: null,
    },
  },

  // ============ PARTNER USER STATES (e.g., 45Drives) ============
  // Note: partnerInfo is automatically derived from activationCode by the API
  // So we only need to set activationCode - no duplication needed!
  {
    id: 'partner-incomplete',
    label: '5. Partner User - Incomplete',
    description: 'Partner user in incomplete onboarding state',
    overrides: {
      currentVersion: '7.3.0',
      registrationState: RegistrationState.ENOKEYFILE,
      onboarding: {
        completed: false,
        completedAtVersion: null,
      },
      activationCode: {
        code: 'DEMO-PARTNER-CODE-123',
        partner: {
          name: '45Drives',
          url: 'https://45drives.com',
          hardwareSpecsUrl: 'https://45drives.com/specs/storinator-s45',
          manualUrl: 'https://45drives.com/docs/storinator-manual',
          supportUrl: 'https://45drives.com/support',
          extraLinks: [
            { title: 'Community Forums', url: 'https://45drives.com/forums' },
            { title: 'Knowledge Base', url: 'https://45drives.com/kb' },
          ],
        },
        branding: {
          theme: 'azure',
          hasPartnerLogo: true,
          partnerLogoLightUrl: '/config/activate/45drives-logo-light.png',
          partnerLogoDarkUrl: '/config/activate/45drives-logo-dark.png',
          onboardingTitle: 'Welcome to Storinator',
          onboardingSubtitle: 'Unleash your massive storage',
          onboardingTitleFreshInstall: 'Welcome to your new Storinator',
          onboardingSubtitleFreshInstall: 'Let us get your storage stack configured.',
          onboardingTitleIncomplete: 'Finish Storinator setup',
          onboardingSubtitleIncomplete: 'Pick up right where you left off.',
        },
        system: {
          serverName: 'Storinator S45',
          model: 'Storinator',
        },
      },
    },
  },
  {
    id: 'partner-upgrade',
    label: '6. Partner User - Upgrade',
    description: 'Partner user completed on older version, now upgraded',
    overrides: {
      currentVersion: '7.3.0',
      registrationState: RegistrationState.EGUID,
      onboarding: {
        completed: true,
        completedAtVersion: '7.1.0',
      },
      activationCode: {
        code: 'DEMO-PARTNER-CODE-456',
        partner: {
          name: '45Drives',
          url: 'https://45drives.com',
          hardwareSpecsUrl: 'https://45drives.com/specs/storinator-av15',
          manualUrl: 'https://45drives.com/docs/storinator-manual',
          supportUrl: 'https://45drives.com/support',
        },
        branding: {
          theme: 'azure',
          hasPartnerLogo: true,
          partnerLogoLightUrl: '/config/activate/45drives-logo-light.png',
          partnerLogoDarkUrl: '/config/activate/45drives-logo-dark.png',
          onboardingTitle: 'Welcome to Storinator',
          onboardingSubtitle: 'Your powerful storage solution',
          onboardingTitleFreshInstall: 'Welcome to your Storinator',
          onboardingSubtitleFreshInstall: 'We will walk through first-time setup.',
          onboardingTitleUpgrade: 'Thanks for upgrading Storinator',
          onboardingSubtitleUpgrade: 'Review the latest updates and continue.',
          onboardingTitleDowngrade: 'Welcome back to Storinator',
          onboardingSubtitleDowngrade: 'You are on an earlier release. Let us re-check setup.',
          onboardingTitleIncomplete: 'Finish Storinator setup',
          onboardingSubtitleIncomplete: 'Pick up right where you left off.',
        },
        system: {
          serverName: 'Storinator AV15',
          model: 'Storinator',
        },
      },
    },
  },
  {
    id: 'partner-downgrade',
    label: '7. Partner User - Downgrade',
    description: 'Partner user completed on newer version, now downgraded',
    overrides: {
      currentVersion: '7.3.0',
      registrationState: RegistrationState.EGUID,
      onboarding: {
        completed: true,
        completedAtVersion: '9.0.0',
      },
      activationCode: {
        code: 'DEMO-PARTNER-CODE-654',
        partner: {
          name: '45Drives',
          url: 'https://45drives.com',
        },
        branding: {
          theme: 'azure',
          hasPartnerLogo: true,
          partnerLogoLightUrl: '/config/activate/45drives-logo-light.png',
          partnerLogoDarkUrl: '/config/activate/45drives-logo-dark.png',
          onboardingTitle: 'Welcome to Storinator',
          onboardingSubtitle: 'High-performance storage',
          onboardingTitleFreshInstall: 'Welcome to your Storinator',
          onboardingSubtitleFreshInstall: 'Let us configure the essentials.',
          onboardingTitleUpgrade: 'Thanks for upgrading Storinator',
          onboardingSubtitleUpgrade: 'Review updates before continuing.',
          onboardingTitleDowngrade: 'Welcome back to Storinator',
          onboardingSubtitleDowngrade: 'You are on an earlier release. Let us re-check setup.',
          onboardingTitleIncomplete: 'Finish Storinator setup',
          onboardingSubtitleIncomplete: 'Complete the remaining steps.',
        },
        system: {
          serverName: 'Storinator X',
          model: 'Storinator',
        },
      },
    },
  },
  {
    id: 'partner-completed',
    label: '8. Partner User - Completed',
    description: 'Partner user in completed onboarding state (version-agnostic)',
    overrides: {
      currentVersion: '7.3.0',
      registrationState: RegistrationState.EGUID,
      onboarding: {
        completed: true,
        completedAtVersion: null,
      },
      activationCode: {
        code: 'DEMO-PARTNER-CODE-789',
        partner: {
          name: '45Drives',
          url: 'https://45drives.com',
        },
        branding: {
          theme: 'azure',
          hasPartnerLogo: true,
          partnerLogoLightUrl: '/config/activate/45drives-logo-light.png',
          partnerLogoDarkUrl: '/config/activate/45drives-logo-dark.png',
          onboardingTitle: 'Welcome to Storinator',
          onboardingSubtitle: 'High-performance storage',
          onboardingTitleFreshInstall: 'Welcome to your Storinator',
          onboardingSubtitleFreshInstall: 'Get your system configured in minutes.',
          onboardingTitleUpgrade: 'Thanks for upgrading Storinator',
          onboardingSubtitleUpgrade: 'Let us review what changed.',
          onboardingTitleDowngrade: 'Welcome back to Storinator',
          onboardingSubtitleDowngrade: 'You are on an earlier release. Let us re-check setup.',
          onboardingTitleIncomplete: 'Finish Storinator setup',
          onboardingSubtitleIncomplete: 'Complete the final setup items.',
        },
        system: {
          serverName: 'Storinator Q30',
          model: 'Storinator',
        },
      },
    },
  },
]);

const formattedOverrides = (value: OnboardingOverridePayload | null) => {
  if (!value) return '';
  return JSON.stringify(value, null, 2);
};

const clearOnboardingDraftStorage = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('onboardingDraft');
  const keysToRemove = Object.keys(localStorage).filter((key) => key.includes('onboardingDraft'));
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

const hardRefreshPageBestEffort = async () => {
  if (typeof window === 'undefined') return;

  try {
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
    }
  } catch (error) {
    console.warn('[OnboardingAdminPanel] Failed to clear CacheStorage before refresh:', error);
  }

  window.location.reload();
};

onMounted(() => {
  if (typeof window === 'undefined') return;
  resetDraftAndHardRefreshOnOpen.value = localStorage.getItem(RESET_DRAFT_AND_REFRESH_KEY) === 'true';
});

const setResetDraftAndHardRefreshOnOpen = (value: boolean) => {
  resetDraftAndHardRefreshOnOpen.value = value;
  if (typeof window !== 'undefined') {
    localStorage.setItem(RESET_DRAFT_AND_REFRESH_KEY, value ? 'true' : 'false');
  }
};

const onResetDraftAndHardRefreshChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  setResetDraftAndHardRefreshOnOpen(Boolean(target?.checked));
};

const onMockUnauthenticatedChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  onboardingStore.setMockUnauthenticated(Boolean(target?.checked));
};

const getMutationInput = (payload: OnboardingOverridePayload) => {
  const mutationInput = { ...payload };
  delete mutationInput.currentVersion;
  return mutationInput;
};

// "Load" the preset into the editor (for editing) - and set as active selection
// If the same preset is already selected, don't reset the editor (preserve edits)
// When switching presets, save current edits to cache and restore cached edits if available
const loadPreset = (preset: Preset) => {
  // If same preset, do nothing - preserve any edits
  if (activePresetId.value === preset.id) {
    return;
  }

  // Save current edits to cache before switching (if we have an active preset)
  if (activePresetId.value && draftJson.value.trim()) {
    presetEditCache.value.set(activePresetId.value, draftJson.value);
  }

  // Switch to new preset
  activePresetId.value = preset.id;
  errorMessage.value = '';

  // Check if we have cached edits for this preset
  const cachedEdits = presetEditCache.value.get(preset.id);
  if (cachedEdits) {
    // Restore cached edits
    draftJson.value = cachedEdits;
  } else {
    // Load fresh from preset defaults
    draftJson.value = formattedOverrides(preset.overrides);
  }
};

// Apply preset directly - Acts as "Activate"
// If the same preset is already selected, preserve any edits made to the JSON
const applyAndOpenPreset = async (preset: Preset) => {
  const isSamePreset = activePresetId.value === preset.id;

  // Only reset to preset defaults if switching to a different preset
  if (!isSamePreset) {
    activePresetId.value = preset.id;
    draftJson.value = formattedOverrides(preset.overrides);
  }

  errorMessage.value = '';

  if (resetDraftAndHardRefreshOnOpen.value) {
    clearOnboardingDraftStorage();
  }

  await applyOverrides();
  await nextTick();
  const shouldOpen =
    status.value === 'INCOMPLETE' || status.value === 'UPGRADE' || status.value === 'DOWNGRADE';
  activationModalStore.setIsHidden(!shouldOpen);

  if (resetDraftAndHardRefreshOnOpen.value) {
    await hardRefreshPageBestEffort();
  }
};

const clearOverrides = async () => {
  if (!confirm('Clear all overrides? This will return to reading real data from disk.')) {
    return;
  }
  await apolloClient.mutate({
    mutation: CLEAR_ONBOARDING_OVERRIDE_MUTATION,
    fetchPolicy: 'no-cache',
  });
  onboardingStore.setMockOsVersion(null);
  lastApplied.value = '';
  draftJson.value = '';
  activePresetId.value = null; // Clear active state
  presetEditCache.value.clear(); // Clear all cached edits
  await apolloClient.refetchQueries({
    include: ['ActivationCode', 'PublicWelcomeData', 'Onboarding', 'PartnerInfo'],
  });
};

// Reset the JSON editor back to the currently selected preset's original values
// Also clears the edit cache for this preset
const resetToPreset = () => {
  if (!activePresetId.value) {
    errorMessage.value = 'No preset selected. Select a preset first.';
    return;
  }
  const activePreset = presets.value.find((p) => p.id === activePresetId.value);
  if (!activePreset) {
    errorMessage.value = 'Selected preset not found.';
    return;
  }
  // Clear cached edits for this preset
  presetEditCache.value.delete(activePresetId.value);
  // Restore original preset values
  draftJson.value = formattedOverrides(activePreset.overrides);
  errorMessage.value = '';
};

const applyOverrides = async () => {
  const trimmed = draftJson.value.trim();
  if (!trimmed) {
    try {
      await clearOverrides();
      errorMessage.value = '';
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? `Failed to clear overrides: ${error.message}`
          : 'Failed to clear overrides';
    }
    return;
  }

  try {
    const parsed = JSON.parse(trimmed) as OnboardingOverridePayload;
    if (Object.prototype.hasOwnProperty.call(parsed, 'currentVersion')) {
      onboardingStore.setMockOsVersion(parsed.currentVersion ?? null);
    }
    await apolloClient.mutate({
      mutation: SET_ONBOARDING_OVERRIDE_MUTATION,
      variables: { input: getMutationInput(parsed) },
      fetchPolicy: 'no-cache',
    });
    lastApplied.value = trimmed;
    await apolloClient.refetchQueries({
      include: ['ActivationCode', 'PublicWelcomeData', 'Onboarding', 'PartnerInfo'],
    });
    errorMessage.value = '';

    // Do not auto-open modal on generic apply; use preset "Open" or manual button.
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON payload';
  }
};

const updateRegistrationState = (newState: string) => {
  if (!newState) return;

  let current: OnboardingOverridePayload = {};
  if (draftJson.value) {
    try {
      current = JSON.parse(draftJson.value);
    } catch (e) {
      // ignore, start fresh if invalid
    }
  }

  // Merge
  current.registrationState = newState as RegistrationState;

  // Update Draft
  draftJson.value = formattedOverrides(current);

  // Apply
  void applyOverrides();
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

// Helper to get status badge color
const getStatusBadgeClass = (statusValue: string | undefined) => {
  switch (statusValue) {
    case 'COMPLETED':
      return 'bg-green-500/15 text-green-600 dark:text-green-400';
    case 'INCOMPLETE':
      return 'bg-orange-500/15 text-orange-600 dark:text-orange-400';
    case 'UPGRADE':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400';
    case 'DOWNGRADE':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
    default:
      return 'bg-gray-500/15 text-gray-600 dark:text-gray-400';
  }
};

const currentRegistrationState = computed({
  get: () => {
    try {
      if (!draftJson.value) return '';
      const parsed = JSON.parse(draftJson.value);
      return parsed.registrationState || '';
    } catch {
      return '';
    }
  },
  set: (val) => {
    updateRegistrationState(val);
  },
});
</script>

<template>
  <div
    class="bg-background text-foreground flex h-full max-h-screen flex-col gap-6 overflow-auto p-6 pb-8"
  >
    <!-- Current State Panel -->
    <div class="border-border bg-card shrink-0 rounded-lg border p-5 shadow-sm">
      <div class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <div class="flex gap-2">
            <span
              :class="getStatusBadgeClass(status)"
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              >Status: {{ status || 'Loading...' }}</span
            >
            <span
              v-if="isPartnerBuild"
              class="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400"
              >Partner Build</span
            >
          </div>
        </div>
        <h2 class="text-muted-foreground text-xs font-bold tracking-wider uppercase">Current State</h2>
      </div>

      <div class="grid grid-cols-1 gap-6 text-sm md:grid-cols-4">
        <!-- Onboarding Status -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            Onboarding
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Status:</span>
            <span class="font-mono text-xs font-bold">{{ status || 'N/A' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Completed:</span>
            <span class="font-mono text-xs">{{ completed }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Completed At:</span>
            <span class="font-mono text-xs">{{ completedAtVersion || '-' }}</span>
          </div>
        </div>

        <!-- Registration -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            Configuration Context
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Fresh Install:</span>
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

        <!-- Partner -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            Partner Data
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Is Partner Build:</span>
            <span class="font-mono text-xs">{{ isPartnerBuild }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Has Activation Code:</span>
            <span class="font-mono text-xs">{{ hasActivationCode }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Partner:</span>
            <span class="font-mono text-xs">{{ partnerInfo?.partner?.name || '-' }}</span>
          </div>
        </div>

        <!-- System -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            System
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Unraid Version:</span>
            <span class="font-mono text-xs">{{ osVersion || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Effective Version:</span>
            <span class="font-mono text-xs">{{ effectiveOsVersion || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Supports Onboarding:</span>
            <span
              class="font-mono text-xs"
              :class="
                isVersionSupported
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-orange-600 dark:text-orange-400'
              "
              >{{ isVersionSupported }}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Logo:</span>
            <span class="font-mono text-xs">{{
              partnerInfo?.branding?.hasPartnerLogo ? 'Custom' : 'Default'
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Extra Settings -->
    <div class="border-border bg-card shrink-0 rounded-lg border p-5 shadow-sm">
      <div class="mb-4">
        <h2 class="text-muted-foreground text-xs font-bold tracking-wider uppercase">Extra Settings</h2>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="border-border bg-background rounded-lg border p-3 shadow-sm">
          <label class="text-muted-foreground mb-2 block text-xs font-semibold uppercase"
            >Force License State</label
          >
          <select
            v-model="currentRegistrationState"
            class="border-input bg-background text-foreground focus:ring-primary w-full rounded border px-3 py-1.5 text-xs focus:ring-1 focus:outline-none"
          >
            <option value="" disabled selected>Select State...</option>
            <option value="ENOKEYFILE">ENOKEYFILE (Unregistered)</option>
            <option value="TRIAL">TRIAL</option>
            <option value="BASIC">BASIC</option>
            <option value="PLUS">PLUS</option>
            <option value="PRO">PRO</option>
            <option value="UNLEASHED">UNLEASHED</option>
            <option value="LIFETIME">LIFETIME</option>
            <option value="EGUID">EGUID (Error)</option>
            <option value="EEXPIRED">EEXPIRED (Trial End)</option>
          </select>
        </div>

        <div class="border-border bg-background rounded-lg border p-3 shadow-sm">
          <label class="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              class="mt-0.5"
              :checked="resetDraftAndHardRefreshOnOpen"
              @change="onResetDraftAndHardRefreshChange"
            />
            <div>
              <div class="text-foreground text-xs font-semibold uppercase">
                Reset Draft + Hard Refresh on Open
              </div>
              <div class="text-muted-foreground text-xs">
                When enabled, pressing <strong>Open</strong> clears
                <code class="bg-muted rounded px-1">onboardingDraft</code> from localStorage, then
                reloads the page after applying overrides.
              </div>
            </div>
          </label>
        </div>

        <div class="border-border bg-background rounded-lg border p-3 shadow-sm">
          <label class="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              class="mt-0.5"
              :checked="mockUnauthenticated"
              @change="onMockUnauthenticatedChange"
            />
            <div>
              <div class="text-foreground text-xs font-semibold uppercase">
                Mock Unauthenticated User
              </div>
              <div class="text-muted-foreground text-xs">
                Simulates unauthenticated onboarding requests (401/CSRF) to verify onboarding modals
                remain hidden. This setting persists in localStorage.
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Controls Area -->
    <div class="grid h-[460px] min-h-[460px] grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Left Column -->
      <div class="flex min-h-0 flex-col lg:col-span-4">
        <!-- Presets List -->
        <div class="border-border bg-card flex min-h-0 flex-1 flex-col rounded-lg border shadow-sm">
          <div
            class="border-border bg-muted flex items-center justify-between rounded-t-lg border-b p-3"
          >
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
      </div>

      <!-- JSON Editor (Right) -->
      <div class="border-border bg-card flex min-h-0 flex-col rounded-lg border shadow-sm lg:col-span-8">
        <div class="border-border bg-muted flex items-center justify-between rounded-t-lg border-b p-3">
          <div class="flex items-center gap-2">
            <!-- overrides for .activationcode, onboarding-tracker, and some api and os files -->
            <h3 class="text-sm font-semibold">Overrides</h3>
            <span v-if="activePresetId" class="text-muted-foreground text-xs">
              ({{ presets.find((p) => p.id === activePresetId)?.label || 'Custom' }})
            </span>
          </div>
          <div class="flex gap-2">
            <button
              @click="clearOverrides"
              class="border-border text-foreground hover:bg-muted rounded border px-3 py-1 text-xs font-medium transition-colors"
              title="Clear all overrides and return to real server data"
            >
              Simulate Current Server's Onboarding
            </button>
            <button
              @click="resetToPreset"
              :disabled="!activePresetId"
              class="rounded border px-3 py-1 text-xs font-medium transition-colors"
              :class="
                activePresetId
                  ? 'border-orange-500 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20'
                  : 'border-border cursor-not-allowed text-gray-400'
              "
            >
              Reset Current Preset
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

    <!-- Data Source Reference Section -->
    <div class="border-border bg-elevated mt-4 shrink-0 rounded-lg border p-4">
      <div class="mb-4 flex items-center gap-2">
        <InformationCircleIcon class="text-muted-foreground h-5 w-5" />
        <h3 class="text-sm font-semibold">Data Source Reference</h3>
      </div>
      <p class="text-muted-foreground mb-4 text-xs">
        This table shows where each override field originates from on a real Unraid system.
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-border border-b">
              <th class="text-muted-foreground py-2 pr-4 font-medium">Override Field</th>
              <th class="text-muted-foreground py-2 pr-4 font-medium">Original Source</th>
              <th class="text-muted-foreground py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-border divide-y">
            <tr>
              <td class="py-2 pr-4 font-mono text-orange-500">registrationState</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">/var/local/emhttp/var.ini</code>
              </td>
              <td class="text-muted-foreground py-2">
                Read from <code>regCheck</code> or <code>regTy</code> field
              </td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-blue-500">onboarding.completed</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">onboarding-tracker.json</code>
              </td>
              <td class="text-muted-foreground py-2">Stored in flash config directory</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-blue-500">onboarding.completedAtVersion</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">onboarding-tracker.json</code>
              </td>
              <td class="text-muted-foreground py-2">Used to detect upgrades</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-green-500">activationCode.*</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">/boot/config/activate/*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">Partner/OEM activation JSON file</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-green-500">activationCode.code</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode → code</code>
              </td>
              <td class="text-muted-foreground py-2">
                Unique activation code string (exposed as <code>onboarding.activationCode</code>)
              </td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-cyan-500">activationCode.partner.hardwareSpecsUrl</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">Link to hardware specifications (optional)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-cyan-500">activationCode.partner.manualUrl</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">Link to system manual (optional)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-cyan-500">activationCode.partner.supportUrl</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">Link to support page (optional)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-cyan-500">activationCode.partner.extraLinks[]</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">
                Array of {title, url} for custom partner links (optional)
              </td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-cyan-500">
                activationCode.branding.partnerLogoLightUrl
              </td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">Partner logo URL used for azure/white themes</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-cyan-500">
                activationCode.branding.partnerLogoDarkUrl
              </td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">Partner logo URL used for black/gray themes</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-purple-500">
                partnerInfo.partner.* / partnerInfo.branding.*
              </td>
              <td class="py-2 pr-4">
                <span class="italic">Computed</span>
              </td>
              <td class="text-muted-foreground py-2">
                Derived from activation code + logo fields + logo file presence
              </td>
            </tr>
            <tr class="bg-muted/30">
              <td class="py-2 pr-4 font-mono text-gray-400">status</td>
              <td class="py-2 pr-4">
                <span class="italic">Computed by API</span>
              </td>
              <td class="text-muted-foreground py-2">
                INCOMPLETE | UPGRADE | COMPLETED (based on tracker + current version)
              </td>
            </tr>
            <tr class="bg-muted/30">
              <td class="py-2 pr-4 font-mono text-gray-400">isPartnerBuild</td>
              <td class="py-2 pr-4">
                <span class="italic">Computed by API</span>
              </td>
              <td class="text-muted-foreground py-2">true if activation code exists</td>
            </tr>
            <tr class="bg-muted/30">
              <td class="py-2 pr-4 font-mono text-gray-400">currentVersion</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">/etc/unraid-version</code>
              </td>
              <td class="text-muted-foreground py-2">
                Available via <code>info.versions.core.unraid</code> query. For testing, you can also set
                top-level <code>currentVersion</code> in JSON (UI-only override).
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="border-border text-muted-foreground mt-4 space-y-2 border-t pt-3 text-xs">
        <p>
          <strong class="text-foreground">Tip:</strong> Fields in
          <span class="text-gray-400">gray</span> are computed and cannot be directly overridden.
          <code class="bg-muted rounded px-1">currentVersion</code> is the one exception and is treated
          as a local UI testing override.
        </p>
        <p>
          <strong class="text-green-500">Simplified:</strong> You only need to edit
          <code class="bg-muted rounded px-1">activationCode.*</code> fields. The API automatically
          derives <code class="bg-muted rounded px-1">partnerInfo</code> from it!
        </p>
      </div>
    </div>
  </div>
</template>
