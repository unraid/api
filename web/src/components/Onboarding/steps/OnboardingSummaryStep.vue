<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';

import {
  ChevronLeftIcon,
  ClipboardDocumentCheckIcon,
  CubeIcon,
  GlobeAltIcon,
  LanguageIcon,
  PuzzlePieceIcon,
  SwatchIcon,
} from '@heroicons/vue/24/outline';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton, Dialog } from '@unraid/ui';
import OnboardingConsole from '@/components/Onboarding/components/OnboardingConsole.vue';
import usePluginInstaller, {
  INSTALL_OPERATION_TIMEOUT_CODE,
} from '@/components/Onboarding/composables/usePluginInstaller';
import { GET_AVAILABLE_LANGUAGES_QUERY } from '@/components/Onboarding/graphql/availableLanguages.query';
import { COMPLETE_ONBOARDING_MUTATION } from '@/components/Onboarding/graphql/completeUpgradeStep.mutation';
import {
  SET_LOCALE_MUTATION,
  SET_THEME_MUTATION,
  UPDATE_SERVER_IDENTITY_MUTATION,
  UPDATE_SSH_SETTINGS_MUTATION,
} from '@/components/Onboarding/graphql/coreSettings.mutations';
import { GET_CORE_SETTINGS_QUERY } from '@/components/Onboarding/graphql/getCoreSettings.query';
import { INSTALLED_UNRAID_PLUGINS_QUERY } from '@/components/Onboarding/graphql/installedPlugins.query';
import { UPDATE_SYSTEM_TIME_MUTATION } from '@/components/Onboarding/graphql/updateSystemTime.mutation';
import { useActivationCodeModalStore } from '@/components/Onboarding/store/activationCodeModal';
import { cleanupOnboardingStorage } from '@/components/Onboarding/store/onboardingStorageCleanup';
import { useUpgradeOnboardingStore } from '@/components/Onboarding/store/upgradeOnboarding';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';

import type { LogEntry } from '@/components/Onboarding/components/OnboardingConsole.vue';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useOnboardingDraftStore } from '~/components/Onboarding/store/onboardingDraft';
import { PluginInstallStatus, ThemeName } from '~/composables/gql/graphql';

export interface Props {
  onComplete: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();
const draftStore = useOnboardingDraftStore();
const { activationCode, isFreshInstall, registrationState } = storeToRefs(useActivationCodeDataStore());
const { refetchOnboarding } = useUpgradeOnboardingStore();
const modalStore = useActivationCodeModalStore();

// Setup Mutations
const { mutate: updateSystemTime } = useMutation(UPDATE_SYSTEM_TIME_MUTATION);
const { mutate: updateServerIdentity } = useMutation(UPDATE_SERVER_IDENTITY_MUTATION);
const { mutate: setTheme } = useMutation(SET_THEME_MUTATION);
const { mutate: setLocale } = useMutation(SET_LOCALE_MUTATION);
const { mutate: updateSshSettings } = useMutation(UPDATE_SSH_SETTINGS_MUTATION);
const { mutate: completeOnboarding } = useMutation(COMPLETE_ONBOARDING_MUTATION);

const { installLanguage, installPlugin } = usePluginInstaller();

// Fetch Current Settings (for comparison if needed)
const { result: coreSettingsResult, error: coreSettingsError } = useQuery(
  GET_CORE_SETTINGS_QUERY,
  null,
  {
    fetchPolicy: 'cache-first',
  }
);
const { result: installedPluginsResult, refetch: refetchInstalledPlugins } = useQuery(
  INSTALLED_UNRAID_PLUGINS_QUERY,
  null,
  {
    fetchPolicy: 'cache-first',
  }
);
const { result: availableLanguagesResult } = useQuery(GET_AVAILABLE_LANGUAGES_QUERY, null, {
  fetchPolicy: 'cache-first',
});

const draftPluginsCount = computed(() => draftStore.selectedPlugins?.size ?? 0);

const currentTimeZone = computed(() => {
  return (
    draftStore.selectedTimeZone ||
    coreSettingsResult.value?.systemTime?.timeZone ||
    t('onboarding.coreSettings.notConfigured')
  );
});

const serverName = computed(() => {
  return draftStore.serverName || coreSettingsResult.value?.vars?.name || 'Tower';
});

const activationSystemModel = computed(() => activationCode.value?.system?.model?.trim() || undefined);

const sshEnabled = computed(() => {
  return draftStore.useSsh;
});

const displayTheme = computed(() => {
  return draftStore.selectedTheme || coreSettingsResult.value?.display?.theme || 'white';
});

const displayLanguage = computed(() => {
  return draftStore.selectedLanguage || coreSettingsResult.value?.display?.locale || 'en_US';
});

// Processing State
const isProcessing = ref(false);
const error = ref<string | null>(null);
const logs = ref<LogEntry[]>([]);
const showConsole = computed(() => isProcessing.value || logs.value.length > 0);
const showApplyResultDialog = ref(false);
const applyResultTitle = ref('');
const applyResultMessage = ref('');
const applyResultSeverity = ref<'success' | 'warning' | 'error'>('success');

const addLog = (message: string, type: LogEntry['type'] = 'info') => {
  logs.value.push({ message, type, timestamp: Date.now() });
};

const showDiagnosticLogsInResultDialog = computed(
  () => applyResultSeverity.value !== 'success' && logs.value.length > 0
);

const isInstallTimeoutError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === INSTALL_OPERATION_TIMEOUT_CODE ||
    Boolean(candidate.message?.includes('Timed out waiting for install operation'))
  );
};

const isSshStateVerified = (
  vars: { useSsh?: boolean | null; portssh?: number | string | null } | undefined,
  targetEnabled: boolean,
  targetPort: number
) => {
  if (!vars) {
    return false;
  }

  const currentEnabled = Boolean(vars.useSsh);
  if (currentEnabled !== targetEnabled) {
    return false;
  }

  if (!targetEnabled) {
    return true;
  }

  const currentPort = Number(vars.portssh);
  return Number.isFinite(currentPort) && currentPort === targetPort;
};

const getSshVarsFromMutationResult = (result: unknown) => {
  if (!result || typeof result !== 'object') {
    return undefined;
  }

  const response = result as {
    data?: { updateSshSettings?: { useSsh?: boolean | null; portssh?: number | string | null } };
    updateSshSettings?: { useSsh?: boolean | null; portssh?: number | string | null };
  };

  return response.data?.updateSshSettings ?? response.updateSshSettings;
};

const THEME_NAMES = new Set<ThemeName>(Object.values(ThemeName));

const normalizeThemeName = (value?: string | null): ThemeName => {
  const normalized = (value ?? '').trim().toLowerCase() as ThemeName;
  return THEME_NAMES.has(normalized) ? normalized : ThemeName.WHITE;
};

const TRUSTED_DEFAULT_PROFILE = Object.freeze({
  serverName: 'Tower',
  serverDescription: '',
  timeZone: 'UTC',
  theme: ThemeName.WHITE,
  locale: 'en_US',
  useSsh: false,
});

interface CoreSettingsSnapshot {
  serverName: string;
  serverDescription: string;
  timeZone: string;
  theme: ThemeName;
  locale: string;
  useSsh: boolean;
}

const resolveTargetCoreSettings = (): CoreSettingsSnapshot => ({
  serverName: draftStore.serverName || TRUSTED_DEFAULT_PROFILE.serverName,
  serverDescription: draftStore.serverDescription || TRUSTED_DEFAULT_PROFILE.serverDescription,
  timeZone: draftStore.selectedTimeZone || TRUSTED_DEFAULT_PROFILE.timeZone,
  theme: normalizeThemeName(draftStore.selectedTheme || TRUSTED_DEFAULT_PROFILE.theme),
  locale: draftStore.selectedLanguage || TRUSTED_DEFAULT_PROFILE.locale,
  useSsh: typeof draftStore.useSsh === 'boolean' ? draftStore.useSsh : TRUSTED_DEFAULT_PROFILE.useSsh,
});

const normalizePluginFileName = (value: string) => value.trim().toLowerCase();
const getPluginFileName = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1] ?? url;
};

const pluginMap: Record<string, { url: string; name: string }> = {
  'community-apps': {
    url: 'https://raw.githubusercontent.com/unraid/community.applications/master/plugins/community.applications.plg',
    name: 'Community Apps',
  },
  'fix-common-problems': {
    url: 'https://raw.githubusercontent.com/unraid/fix.common.problems/master/plugins/fix.common.problems.plg',
    name: 'Fix Common Problems',
  },
  tailscale: {
    url: 'https://raw.githubusercontent.com/unraid/unraid-tailscale/main/plugin/tailscale.plg',
    name: 'Tailscale',
  },
};

const installedPluginFileNames = computed(() => {
  const installed = installedPluginsResult.value?.installedUnraidPlugins ?? [];
  return new Set(installed.map((name) => normalizePluginFileName(name)));
});

const pluginIdsToInstall = computed(() => {
  return Array.from(draftStore.selectedPlugins).filter((pluginId) => {
    const details = pluginMap[pluginId];
    if (!details) return false;
    const fileName = normalizePluginFileName(getPluginFileName(details.url));
    return !installedPluginFileNames.value.has(fileName);
  });
});

const selectedPluginSummaries = computed(() => {
  return Array.from(draftStore.selectedPlugins).map((pluginId) => {
    const details = pluginMap[pluginId];
    const pluginName = details?.name ?? pluginId;
    const pluginFileName = details ? normalizePluginFileName(getPluginFileName(details.url)) : null;
    const installed = pluginFileName ? installedPluginFileNames.value.has(pluginFileName) : false;

    return {
      id: pluginId,
      name: pluginName,
      installed,
    };
  });
});

const hasCoreSettingChanges = computed(() => {
  const currentTimezone = coreSettingsResult.value?.systemTime?.timeZone || '';
  const currentName =
    coreSettingsResult.value?.server?.name || coreSettingsResult.value?.vars?.name || '';
  const currentDescription = coreSettingsResult.value?.server?.comment || '';
  const currentTheme = coreSettingsResult.value?.display?.theme || 'white';
  const currentLocale = coreSettingsResult.value?.display?.locale || 'en_US';
  const currentSsh = Boolean(coreSettingsResult.value?.vars?.useSsh || false);

  return (
    draftStore.selectedTimeZone !== currentTimezone ||
    draftStore.serverName !== currentName ||
    draftStore.serverDescription !== currentDescription ||
    draftStore.selectedTheme !== currentTheme ||
    draftStore.selectedLanguage !== currentLocale ||
    draftStore.useSsh !== currentSsh
  );
});

const hasAnyChangesToApply = computed(
  () => hasCoreSettingChanges.value || pluginIdsToInstall.value.length > 0
);
const isApplyDataReady = computed(() =>
  Boolean(coreSettingsResult.value?.server && coreSettingsResult.value?.vars)
);
const hasBaselineQueryError = computed(() => Boolean(coreSettingsError.value));
const applyReadinessTimedOut = ref(false);
const APPLY_READINESS_TIMEOUT_MS = 10000;
let applyReadinessTimer: ReturnType<typeof setTimeout> | null = null;

const canApply = computed(
  () => isApplyDataReady.value || applyReadinessTimedOut.value || hasBaselineQueryError.value
);
const showApplyReadinessWarning = computed(
  () => !isApplyDataReady.value && (applyReadinessTimedOut.value || hasBaselineQueryError.value)
);

onMounted(() => {
  applyReadinessTimer = setTimeout(() => {
    if (!isApplyDataReady.value) {
      applyReadinessTimedOut.value = true;
    }
  }, APPLY_READINESS_TIMEOUT_MS);
});

onBeforeUnmount(() => {
  if (applyReadinessTimer) {
    clearTimeout(applyReadinessTimer);
    applyReadinessTimer = null;
  }
});

// Helper to determine activation label/status
const activationStatus = computed(() => {
  const state = registrationState.value;
  const VALID_STATES = ['TRIAL', 'BASIC', 'PLUS', 'PRO', 'STARTER', 'UNLEASHED', 'LIFETIME'];

  if (state && VALID_STATES.includes(state as string)) {
    return {
      label: state,
      valid: true,
      icon: CheckCircleIcon,
      color: 'text-green-500',
    };
  }

  if (state === 'ENOKEYFILE') {
    return {
      label: 'Unregistered',
      valid: false,
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-500',
    };
  }

  // Error Mappings
  const errorMap: Record<string, string> = {
    ENOKEYFILE1: 'Key Missing',
    ENOKEYFILE2: 'Validation Error',
    EGUID: 'GUID Mismatch',
    EEXPIRED: 'Trial Expired',
    EBLACKLISTED: 'Blacklisted',
  };

  if (typeof state === 'string' && state.startsWith('E')) {
    const label = errorMap[state] || `Error: ${state}`;
    return {
      label,
      valid: false,
      icon: ExclamationCircleIcon,
      color: 'text-red-500',
    };
  }

  return {
    label: state || 'Unknown',
    valid: false,
    icon: ExclamationCircleIcon,
    color: 'text-gray-400',
  };
});

const handleComplete = async () => {
  if (isProcessing.value) {
    return;
  }
  if (!canApply.value) {
    error.value = 'Settings are still loading. Please wait a moment and try again.';
    return;
  }

  // Lock modal open
  modalStore.setIsHidden(false);

  isProcessing.value = true;
  error.value = null;
  logs.value = []; // Clear logs

  addLog('Starting configuration...', 'info');
  if (showApplyReadinessWarning.value) {
    addLog('Baseline settings unavailable. Continuing in best-effort mode.', 'info');
  }

  try {
    const promises = [];
    const baselineLoaded = isApplyDataReady.value;
    const targetCoreSettings = resolveTargetCoreSettings();
    let hadNonOptimisticFailures = false;
    let hadWarnings = !baselineLoaded;
    let hadSshVerificationUncertainty = false;
    let completionMarked = false;
    let hadInstallTimeout = false;

    // 1. Apply Core Settings
    const currentTimezone = baselineLoaded
      ? coreSettingsResult.value?.systemTime?.timeZone || TRUSTED_DEFAULT_PROFILE.timeZone
      : TRUSTED_DEFAULT_PROFILE.timeZone;
    const currentName = baselineLoaded
      ? coreSettingsResult.value?.server?.name ||
        coreSettingsResult.value?.vars?.name ||
        TRUSTED_DEFAULT_PROFILE.serverName
      : TRUSTED_DEFAULT_PROFILE.serverName;
    const currentDescription = baselineLoaded
      ? coreSettingsResult.value?.server?.comment || TRUSTED_DEFAULT_PROFILE.serverDescription
      : TRUSTED_DEFAULT_PROFILE.serverDescription;
    const currentTheme = baselineLoaded
      ? coreSettingsResult.value?.display?.theme || TRUSTED_DEFAULT_PROFILE.theme
      : TRUSTED_DEFAULT_PROFILE.theme;
    const currentLocale = baselineLoaded
      ? coreSettingsResult.value?.display?.locale || TRUSTED_DEFAULT_PROFILE.locale
      : TRUSTED_DEFAULT_PROFILE.locale;
    const currentSsh = baselineLoaded
      ? Boolean(coreSettingsResult.value?.vars?.useSsh || false)
      : TRUSTED_DEFAULT_PROFILE.useSsh;
    const currentSysModel = baselineLoaded ? coreSettingsResult.value?.vars?.sysModel || '' : '';
    const shouldApplyPartnerSysModel = Boolean(
      isFreshInstall.value &&
        activationSystemModel.value &&
        (!baselineLoaded || activationSystemModel.value !== currentSysModel)
    );

    if (!baselineLoaded) {
      hadWarnings = true;
      addLog(
        'Baseline settings unavailable. Applying trusted defaults + draft values without diff checks.',
        'info'
      );
    }
    if (shouldApplyPartnerSysModel) {
      addLog('Applying partner customizations...', 'info');
    }

    const shouldApplyTimeZone = baselineLoaded ? targetCoreSettings.timeZone !== currentTimezone : true;
    const shouldApplyServerIdentity = baselineLoaded
      ? targetCoreSettings.serverName !== currentName ||
        targetCoreSettings.serverDescription !== currentDescription ||
        shouldApplyPartnerSysModel
      : true;
    const shouldApplyTheme = baselineLoaded ? targetCoreSettings.theme !== currentTheme : true;
    const shouldApplyLocale = baselineLoaded ? targetCoreSettings.locale !== currentLocale : true;
    const shouldApplySsh = baselineLoaded ? targetCoreSettings.useSsh !== currentSsh : true;

    if (!hasAnyChangesToApply.value) {
      addLog('No settings changed. Skipping configuration mutations.', 'info');
    }

    if (shouldApplyTimeZone) {
      addLog(`Setting TimeZone to ${targetCoreSettings.timeZone}...`, 'info');
      promises.push(
        updateSystemTime({ input: { timeZone: targetCoreSettings.timeZone } })
          .then(() => addLog('TimeZone updated.', 'success'))
          .catch((e) => {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            addLog(`TimeZone request returned an error, continuing: ${e.message}`, 'info');
          })
      );
    }

    if (shouldApplyServerIdentity) {
      addLog(`Updating Server Identity to ${targetCoreSettings.serverName}...`, 'info');
      promises.push(
        updateServerIdentity({
          name: targetCoreSettings.serverName,
          comment: targetCoreSettings.serverDescription,
          sysModel: shouldApplyPartnerSysModel ? activationSystemModel.value : undefined,
        })
          .then(() => addLog('Server Identity updated.', 'success'))
          .catch((e) => {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            addLog(`Server identity request returned an error, continuing: ${e.message}`, 'info');
          })
      );
    }

    if (shouldApplyTheme) {
      addLog(`Setting Theme to ${targetCoreSettings.theme}...`, 'info');
      promises.push(
        setTheme({ theme: targetCoreSettings.theme })
          .then(() => addLog('Theme updated.', 'success'))
          .catch((e) => {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            addLog(`Theme request returned an error, continuing: ${e.message}`, 'info');
          })
      );
    }

    await Promise.all(promises);

    // Install language pack first for non-default locales; only then switch locale.
    if (shouldApplyLocale) {
      const targetLocale = targetCoreSettings.locale;
      if (targetLocale === 'en_US') {
        addLog(`Setting Language to ${targetLocale}...`, 'info');
        await setLocale({ locale: targetLocale })
          .then(() => addLog('Language updated.', 'success'))
          .catch((e) => {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            addLog(`Language request returned an error, continuing: ${e.message}`, 'info');
          });
      } else {
        const availableLanguages =
          availableLanguagesResult.value?.customization?.availableLanguages ?? [];
        const language = availableLanguages.find(
          (item: { code: string; name: string; url?: string | null }) => item.code === targetLocale
        );

        if (!language?.url) {
          hadNonOptimisticFailures = true;
          hadWarnings = true;
          addLog(
            `Language pack metadata for ${targetLocale} is unavailable. Skipping locale change.`,
            'error'
          );
        } else {
          addLog(`Installing language pack for ${language.name}...`, 'info');
          try {
            const installResult = await installLanguage({
              forced: false,
              name: language.name,
              url: language.url,
            });

            if (installResult.status !== PluginInstallStatus.SUCCEEDED) {
              hadNonOptimisticFailures = true;
              hadWarnings = true;
              addLog(
                `Language pack installation did not succeed for ${language.name}. Keeping current locale.`,
                'error'
              );
            } else {
              addLog(`Language pack installed for ${language.name}.`, 'success');
              addLog(`Setting Language to ${targetLocale}...`, 'info');
              await setLocale({ locale: targetLocale })
                .then(() => addLog('Language updated.', 'success'))
                .catch((e) => {
                  hadNonOptimisticFailures = true;
                  hadWarnings = true;
                  addLog(`Language request returned an error, continuing: ${e.message}`, 'info');
                });
            }
          } catch (e: unknown) {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            hadInstallTimeout = hadInstallTimeout || isInstallTimeoutError(e);
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            addLog(
              `Language pack installation failed for ${language.name}. Keeping current locale: ${errorMessage}`,
              'error'
            );
          }
        }
      }
    }

    // 2. Install Plugins
    try {
      await refetchInstalledPlugins();
    } catch {
      hadWarnings = true;
      addLog('Could not refresh installed plugins list. Continuing with current plugin state.', 'info');
    }

    const pluginsToInstall = pluginIdsToInstall.value;
    if (pluginsToInstall.length > 0) {
      addLog(`Installing ${pluginsToInstall.length} plugins...`, 'info');

      for (const pluginId of pluginsToInstall) {
        const details = pluginMap[pluginId];
        if (details) {
          const fileName = normalizePluginFileName(getPluginFileName(details.url));
          if (installedPluginFileNames.value.has(fileName)) {
            addLog(`${details.name} is already installed. Skipping.`, 'info');
            continue;
          }

          addLog(`Installing ${details.name}...`, 'info');
          try {
            const installResult = await installPlugin({
              url: details.url,
              name: details.name,
              forced: false,
              onEvent: (_evt: unknown) => {
                /* verbose */
              },
            });
            if (installResult.status === PluginInstallStatus.SUCCEEDED) {
              addLog(`${details.name} installed.`, 'success');
            } else {
              hadNonOptimisticFailures = true;
              hadWarnings = true;
              addLog(`${details.name} installation failed. Continuing.`, 'error');
            }
          } catch (e: unknown) {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            hadInstallTimeout = hadInstallTimeout || isInstallTimeoutError(e);
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            addLog(
              `Plugin install reported an error for ${details.name}, continuing: ${errorMessage}`,
              'info'
            );
            // Continue installing others
          }
        }
      }
    }

    // 3. SSH (Run separately and optimistically)
    if (shouldApplySsh) {
      addLog(`Updating SSH Settings...`, 'info');
      try {
        const sshUpdateResult = await updateSshSettings({
          enabled: targetCoreSettings.useSsh,
          port: 22,
        });
        const sshVars = getSshVarsFromMutationResult(sshUpdateResult);

        if (isSshStateVerified(sshVars, targetCoreSettings.useSsh, 22)) {
          addLog('SSH settings verified.', 'success');
        } else {
          hadWarnings = true;
          hadSshVerificationUncertainty = true;
          addLog(
            'SSH update submitted, but final SSH state could not be verified yet. Continuing.',
            'info'
          );
        }
      } catch {
        hadWarnings = true;
        hadSshVerificationUncertainty = true;
        addLog('SSH update request returned an error, continuing (service may have restarted).', 'info');
      }
    }

    // 4. Mark Complete
    addLog('Finalizing setup...', 'info');

    try {
      await completeOnboarding();
      completionMarked = true;
      cleanupOnboardingStorage({ clearTemporaryBypassSessionState: true });
      addLog('Setup complete!', 'success');
    } catch (e: unknown) {
      hadWarnings = true;
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      addLog(
        `Could not mark onboarding complete right now (API may be offline): ${errorMessage}`,
        'info'
      );
    }

    if (completionMarked) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Avoid blocking completion UI when API is offline/retrying.
    if (completionMarked && baselineLoaded) {
      try {
        await Promise.race([
          refetchOnboarding(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Onboarding refresh timed out')), 1500)
          ),
        ]);
      } catch {
        hadWarnings = true;
        addLog('Could not refresh onboarding state right now. Continuing.', 'info');
      }
    } else {
      hadWarnings = true;
      addLog('Skipping onboarding state refresh while API is unavailable.', 'info');
    }

    if (!completionMarked) {
      applyResultSeverity.value = 'warning';
      applyResultTitle.value = 'Setup Saved in Best-Effort Mode';
      applyResultMessage.value =
        'We applied what we could, but some results could not be verified because the API is offline. You can review and update settings anytime from the Unraid Dashboard.';
    } else if (hadInstallTimeout) {
      applyResultSeverity.value = 'warning';
      applyResultTitle.value = 'Setup Continued After Timeout';
      applyResultMessage.value =
        'One or more install operations timed out. Some settings may have been applied. You can verify and adjust settings later from the Unraid Dashboard.';
    } else if (hadNonOptimisticFailures) {
      applyResultSeverity.value = 'warning';
      applyResultTitle.value = 'Setup Applied with Warnings';
      applyResultMessage.value =
        'Some settings could not be fully applied or verified. You can review and change any setting later from the Unraid Dashboard.';
    } else if (hadSshVerificationUncertainty) {
      applyResultSeverity.value = 'warning';
      applyResultTitle.value = 'Setup Saved in Best-Effort Mode';
      applyResultMessage.value =
        'Your SSH setting update was submitted, but final state could not be verified yet. You can verify and adjust it later from the Unraid Dashboard.';
    } else if (hadWarnings) {
      applyResultSeverity.value = 'warning';
      applyResultTitle.value = 'Setup Saved in Best-Effort Mode';
      applyResultMessage.value =
        'Your onboarding settings were applied. Some operations are best-effort and may take a moment to reflect. You can adjust settings later from the Unraid Dashboard.';
    } else {
      applyResultSeverity.value = 'success';
      applyResultTitle.value = 'Setup Applied';
      applyResultMessage.value = 'Your onboarding settings were applied successfully.';
    }

    isProcessing.value = false;
    showApplyResultDialog.value = true;
  } catch (err: unknown) {
    console.error('Failed to complete onboarding:', err);
    error.value = 'An error occurred during setup. Please check the logs.';
    isProcessing.value = false;
    addLog('Setup failed.', 'error');
    applyResultSeverity.value = 'error';
    applyResultTitle.value = 'Setup Failed';
    applyResultMessage.value =
      'An unexpected error interrupted onboarding. Review the logs below and share them with support.';
    showApplyResultDialog.value = true;
  }
};

const handleApplyResultConfirm = () => {
  showApplyResultDialog.value = false;
  props.onComplete();
};

const handleBack = () => {
  props.onBack?.();
};
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
    <div class="bg-elevated border-muted rounded-xl border p-6 text-left shadow-sm md:p-10">
      <!-- Header -->
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <ClipboardDocumentCheckIcon class="text-primary h-8 w-8" />
            <h2 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
              {{ t('onboarding.summaryStep.title') }}
            </h2>
          </div>
          <p class="text-muted text-lg">
            {{ t('onboarding.summaryStep.description') }}
          </p>
        </div>
      </div>

      <!-- Initialization Message (Tip Style) -->
      <blockquote class="border-success-500 bg-success-100 text my-8 border-s-4 p-4">
        <div class="flex items-start gap-2">
          <CheckCircleIcon class="text-success mt-0.5 h-6 w-6 flex-shrink-0" />
          <p class="text-sm leading-relaxed">
            <span class="mr-1 mb-1 block">{{ t('onboarding.summaryStep.initializationMessage') }}</span>
          </p>
        </div>
      </blockquote>

      <!-- Summary Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Identity Section -->
        <div class="border-muted bg-bg/50 rounded-lg border p-5">
          <div class="mb-4 flex items-center gap-2">
            <CubeIcon class="text-primary h-5 w-5" />
            <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">
              {{ t('onboarding.summaryStep.systemIdentity') }}
            </h3>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">{{ t('onboarding.coreSettings.serverName') }}</span>
              <span class="text-highlighted font-medium">{{ serverName }}</span>
            </div>
            <div class="bg-elevated flex flex-col rounded text-sm" v-if="draftStore.serverDescription">
              <span class="text-muted">Server Description</span>
              <span class="text-highlighted truncate font-medium">{{
                draftStore.serverDescription
              }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Activation</span>
              <div class="flex items-center gap-1.5">
                <component :is="activationStatus.icon" :class="['h-4 w-4', activationStatus.color]" />
                <span class="text-highlighted font-medium">{{ activationStatus.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Networking & Settings Section -->
        <div class="border-muted bg-bg/50 rounded-lg border p-5">
          <div class="mb-4 flex items-center gap-2">
            <GlobeAltIcon class="text-primary h-5 w-5" />
            <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">Configuration</h3>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">{{ t('onboarding.coreSettings.timezone') }}</span>
              <div class="flex items-center gap-1.5">
                <ClockIcon class="text-muted h-4 w-4" />
                <span class="text-highlighted font-medium">{{ currentTimeZone }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">{{ t('onboarding.coreSettings.ssh') }}</span>
              <div class="flex items-center gap-1.5">
                <div :class="[sshEnabled ? 'bg-green-500' : 'bg-gray-400', 'h-2 w-2 rounded-full']" />
                <span class="text-highlighted font-medium">
                  {{
                    sshEnabled
                      ? t('onboarding.summaryStep.sshActive')
                      : t('onboarding.summaryStep.sshInactive')
                  }}
                </span>
              </div>
            </div>
            <!-- Theme & Language -->
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Theme</span>
              <div class="flex items-center gap-1.5">
                <SwatchIcon class="text-muted h-4 w-4" />
                <span class="text-highlighted font-medium capitalize">{{ displayTheme }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Language</span>
              <div class="flex items-center gap-1.5">
                <LanguageIcon class="text-muted h-4 w-4" />
                <span class="text-highlighted font-medium">{{ displayLanguage }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plugins Summary -->
      <div class="border-muted bg-bg/50 mt-6 rounded-lg border">
        <Disclosure v-slot="{ open }">
          <DisclosureButton
            :disabled="draftPluginsCount === 0"
            :class="[
              'flex w-full items-center justify-between p-5 text-left focus:outline-none',
              draftPluginsCount === 0 ? 'cursor-default' : 'cursor-pointer',
            ]"
          >
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 rounded-lg p-2">
                <PuzzlePieceIcon class="text-primary h-6 w-6" />
              </div>
              <div>
                <h3 class="text-highlighted mb-0.5 text-sm font-bold uppercase">
                  {{ t('onboarding.pluginsStep.title') }}
                </h3>
                <p class="text-muted text-xs">{{ draftPluginsCount }} plugins selected</p>
              </div>
            </div>
            <div
              v-if="draftPluginsCount > 0"
              class="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <span v-if="!open">View Selected</span>
              <span v-else>Hide Selected</span>
              <ChevronDownIcon
                :class="[
                  open ? 'rotate-180 transform' : '',
                  'h-5 w-5 transition-transform duration-200',
                ]"
              />
            </div>
          </DisclosureButton>
          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-out"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <DisclosurePanel class="px-5 pt-0 pb-5">
              <div class="border-muted space-y-2 border-t pt-4">
                <div v-if="draftPluginsCount === 0" class="text-muted text-sm italic">
                  No plugins selected.
                </div>
                <div
                  v-else
                  v-for="plugin in selectedPluginSummaries"
                  :key="plugin.id"
                  class="text-muted flex items-center gap-2 text-sm"
                >
                  <component
                    :is="plugin.installed ? CheckCircleIcon : ClockIcon"
                    :class="[
                      'h-4 w-4 flex-shrink-0',
                      plugin.installed ? 'text-green-500' : 'text-primary',
                    ]"
                  />
                  <span>{{ plugin.name }}</span>
                  <span
                    :class="[
                      'rounded px-1.5 py-0.5 text-xs font-medium',
                      plugin.installed
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-primary/10 text-primary',
                    ]"
                  >
                    {{
                      plugin.installed
                        ? t('onboarding.pluginsStep.alreadyInstalled')
                        : t('onboarding.pluginsStep.willInstall')
                    }}
                  </span>
                </div>
              </div>
            </DisclosurePanel>
          </transition>
        </Disclosure>
      </div>

      <!-- Processing / Error Status -->
      <div v-if="showConsole" class="mt-6">
        <OnboardingConsole :logs="logs" title="System Setup Log" />
      </div>

      <div
        v-if="error"
        class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
      >
        <p class="text-center text-sm font-medium text-red-600 dark:text-red-400">
          {{ error }}
        </p>
      </div>
      <div
        v-if="showApplyReadinessWarning"
        class="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/10"
      >
        <p class="text-center text-sm font-medium text-yellow-700 dark:text-yellow-300">
          We couldn't verify current settings from the server. You can still continue, but setup will
          apply changes in best-effort mode.
        </p>
      </div>

      <Dialog
        v-if="showApplyResultDialog"
        :model-value="showApplyResultDialog"
        :show-footer="false"
        :show-close-button="false"
        size="md"
        class="max-w-md"
      >
        <div class="space-y-6 p-2">
          <div class="space-y-2">
            <h3 class="text-lg font-semibold">{{ applyResultTitle }}</h3>
            <p class="text-muted-foreground text-sm">
              {{ applyResultMessage }}
            </p>
          </div>

          <div v-if="showDiagnosticLogsInResultDialog" class="space-y-3">
            <h4 class="text-sm font-semibold tracking-wide uppercase">Diagnostic Logs</h4>
            <OnboardingConsole :logs="logs" title="Onboarding Diagnostics" />
          </div>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
              @click="handleApplyResultConfirm"
            >
              OK
            </button>
          </div>
        </div>
      </Dialog>

      <!-- Footer -->
      <div
        class="border-muted mt-8 flex flex-col-reverse items-center justify-between gap-6 border-t pt-8 sm:flex-row"
      >
        <button
          v-if="showBack"
          @click="handleBack"
          class="text-muted hover:text-toned group flex items-center justify-center gap-2 font-medium transition-colors sm:w-auto sm:justify-start"
          :disabled="isProcessing"
        >
          <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          {{ t('common.back') }}
        </button>
        <div v-else class="hidden w-1 sm:block" />

        <BrandButton
          :text="''"
          :class="`w-full min-w-[200px] font-bold tracking-wide uppercase shadow-md transition-all sm:w-auto ${
            isProcessing
              ? '!bg-gray-400 !text-white hover:!bg-gray-400'
              : '!bg-primary hover:!bg-primary/90 !text-white hover:shadow-lg'
          }`"
          @click="handleComplete"
          :disabled="isProcessing || !canApply"
          :icon-right="isProcessing ? undefined : ChevronRightIcon"
        >
          <span class="inline-flex items-center gap-2">
            <ArrowPathIcon v-if="isProcessing" class="h-4 w-4 animate-spin" />
            <span>{{
              isProcessing
                ? t('common.loading', 'Loading...')
                : t('onboarding.summaryStep.confirmAndApply')
            }}</span>
          </span>
        </BrandButton>
      </div>
    </div>
  </div>
</template>
