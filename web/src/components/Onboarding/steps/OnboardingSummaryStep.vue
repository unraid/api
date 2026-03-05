<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';

import {
  ChevronLeftIcon,
  CircleStackIcon,
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
import { submitInternalBootCreation } from '@/components/Onboarding/composables/internalBoot';
import { buildOnboardingErrorDiagnostics } from '@/components/Onboarding/composables/onboardingErrorDiagnostics';
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
import { GET_INTERNAL_BOOT_CONTEXT_QUERY } from '@/components/Onboarding/graphql/getInternalBootContext.query';
import { INSTALLED_UNRAID_PLUGINS_QUERY } from '@/components/Onboarding/graphql/installedPlugins.query';
import { UPDATE_SYSTEM_TIME_MUTATION } from '@/components/Onboarding/graphql/updateSystemTime.mutation';
import { useActivationCodeModalStore } from '@/components/Onboarding/store/activationCodeModal';
import { cleanupOnboardingStorage } from '@/components/Onboarding/store/onboardingStorageCleanup';
import { useUpgradeOnboardingStore } from '@/components/Onboarding/store/upgradeOnboarding';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';

import type { LogEntry } from '@/components/Onboarding/components/OnboardingConsole.vue';
import type { OnboardingErrorDiagnostics } from '@/components/Onboarding/composables/onboardingErrorDiagnostics';

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
const { result: internalBootContextResult } = useQuery(GET_INTERNAL_BOOT_CONTEXT_QUERY, null, {
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
  return (
    draftStore.serverName ||
    coreSettingsResult.value?.vars?.name ||
    t('onboarding.coreSettings.defaultServerName')
  );
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

const selectedBootMode = computed(() =>
  draftStore.bootMode === 'storage' || Boolean(draftStore.internalBootSelection) ? 'storage' : 'usb'
);
const bootModeLabel = computed(() =>
  selectedBootMode.value === 'storage'
    ? t('onboarding.summaryStep.bootConfig.bootMethodStorage')
    : t('onboarding.summaryStep.bootConfig.bootMethodUsb')
);

const internalBootSelection = computed(() => {
  if (selectedBootMode.value !== 'storage') {
    return null;
  }
  return draftStore.internalBootSelection ?? null;
});

const hasInternalBootSelection = computed(() => Boolean(internalBootSelection.value));

const formatBootSize = (bootSizeMiB: number) => {
  if (bootSizeMiB === 0) {
    return t('onboarding.internalBootStep.bootSize.wholeDrive');
  }
  return t('onboarding.internalBootStep.bootSize.gbLabel', { size: Math.round(bootSizeMiB / 1024) });
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return t('onboarding.internalBootStep.unknownSize');
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 100 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

const normalizeDeviceName = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  if (trimmed.startsWith('/dev/')) {
    return trimmed.slice('/dev/'.length);
  }
  return trimmed;
};

const deriveDeviceSizeBytes = (
  sectors: number | null | undefined,
  sectorSize: number | null | undefined,
  fallbackSize: number
) => {
  if (
    typeof sectors === 'number' &&
    Number.isFinite(sectors) &&
    sectors > 0 &&
    typeof sectorSize === 'number' &&
    Number.isFinite(sectorSize) &&
    sectorSize > 0
  ) {
    return sectors * sectorSize;
  }
  return fallbackSize;
};

interface InternalBootContextDisk {
  device: string;
  size: number;
  emhttpDeviceId?: string | null;
  emhttpSectors?: number | null;
  emhttpSectorSize?: number | null;
}

const internalBootDeviceLabelById = computed(() => {
  const data = internalBootContextResult.value as { disks?: InternalBootContextDisk[] } | null;
  const disks = data?.disks ?? [];
  const labels = new Map<string, string>();

  for (const disk of disks) {
    const device = normalizeDeviceName(disk.device);
    if (!device) {
      continue;
    }

    const emhttpDeviceId = disk.emhttpDeviceId?.trim() || '';
    const optionValue = emhttpDeviceId || device;
    const sizeBytes = deriveDeviceSizeBytes(disk.emhttpSectors, disk.emhttpSectorSize, disk.size);
    const sizeLabel = formatBytes(sizeBytes);
    const label = `${optionValue} - ${sizeLabel} (${device})`;

    labels.set(optionValue, label);
    labels.set(device, label);
  }

  return labels;
});

const internalBootSummary = computed(() => {
  const selection = internalBootSelection.value;
  if (!selection) {
    return null;
  }

  return {
    poolName: selection.poolName,
    slotCount: selection.slotCount,
    devices: selection.devices,
    bootReservedSize: formatBootSize(selection.bootSizeMiB),
    updateBios: selection.updateBios,
  };
});

// Processing State
const isProcessing = ref(false);
const error = ref<string | null>(null);
const logs = ref<LogEntry[]>([]);
const showConsole = computed(() => isProcessing.value || logs.value.length > 0);
const showApplyResultDialog = ref(false);
const showBootDriveWarningDialog = ref(false);
const applyResultTitle = ref('');
const applyResultMessage = ref('');
const applyResultSeverity = ref<'success' | 'warning' | 'error'>('success');
const summaryT = (key: string, values?: Record<string, unknown>) =>
  t(`onboarding.summaryStep.${key}`, values ?? {});

const addLog = (
  message: string,
  type: LogEntry['type'] = 'info',
  details?: OnboardingErrorDiagnostics
) => {
  logs.value.push({ message, type, timestamp: Date.now(), details });
};

const getErrorMessage = (caughtError: unknown) => {
  if (caughtError instanceof Error) {
    const trimmedMessage = caughtError.message.trim();
    if (trimmedMessage) {
      return trimmedMessage;
    }
  }

  if (typeof caughtError === 'string') {
    const trimmedMessage = caughtError.trim();
    if (trimmedMessage) {
      return trimmedMessage;
    }
  }

  return summaryT('errors.unknownError');
};

interface OnboardingErrorLogContext {
  operation: string;
  variables?: unknown;
}

const addErrorLog = (message: string, caughtError: unknown, context: OnboardingErrorLogContext) => {
  addLog(
    `${message}: ${getErrorMessage(caughtError)}`,
    'error',
    buildOnboardingErrorDiagnostics(caughtError, context)
  );
};

const showDiagnosticLogsInResultDialog = computed(
  () => applyResultSeverity.value !== 'success' && logs.value.length > 0
);
const selectedBootDeviceNames = computed(() => internalBootSummary.value?.devices ?? []);
const selectedBootDevices = computed(() =>
  selectedBootDeviceNames.value.map((deviceId) => ({
    id: deviceId,
    label: internalBootDeviceLabelById.value.get(deviceId) ?? deviceId,
  }))
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
  serverName: t('onboarding.coreSettings.defaultServerName'),
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

type OnboardingPluginDetails = {
  url: string;
  name: string;
  installedFileAliases?: string[];
};

const pluginMap: Record<string, OnboardingPluginDetails> = {
  'community-apps': {
    url: 'https://raw.githubusercontent.com/unraid/community.applications/master/plugins/community.applications.plg',
    name: t('onboarding.pluginsStep.plugins.communityApps.name'),
  },
  'fix-common-problems': {
    url: 'https://raw.githubusercontent.com/unraid/fix.common.problems/master/plugins/fix.common.problems.plg',
    name: t('onboarding.pluginsStep.plugins.fixCommonProblems.name'),
  },
  tailscale: {
    url: 'https://raw.githubusercontent.com/unraid/unraid-tailscale/main/plugin/tailscale.plg',
    name: t('onboarding.pluginsStep.plugins.tailscale.name'),
    installedFileAliases: ['tailscale-preview.plg'],
  },
};

const getPluginInstallDetectionFileNames = (details: OnboardingPluginDetails): Set<string> => {
  const fileNames = new Set<string>([normalizePluginFileName(getPluginFileName(details.url))]);
  for (const alias of details.installedFileAliases ?? []) {
    fileNames.add(normalizePluginFileName(alias));
  }
  return fileNames;
};

const installedPluginFileNames = computed(() => {
  const installed = installedPluginsResult.value?.installedUnraidPlugins ?? [];
  return new Set(installed.map((name) => normalizePluginFileName(name)));
});

const pluginIdsToInstall = computed(() => {
  return Array.from(draftStore.selectedPlugins).filter((pluginId) => {
    const details = pluginMap[pluginId];
    if (!details) return false;
    const detectionFileNames = getPluginInstallDetectionFileNames(details);
    const isInstalled = Array.from(detectionFileNames).some((fileName) =>
      installedPluginFileNames.value.has(fileName)
    );
    return !isInstalled;
  });
});

const selectedPluginSummaries = computed(() => {
  return Array.from(draftStore.selectedPlugins).map((pluginId) => {
    const details = pluginMap[pluginId];
    const pluginName = details?.name ?? pluginId;
    const pluginDetectionFileNames = details ? getPluginInstallDetectionFileNames(details) : null;
    const installed = pluginDetectionFileNames
      ? Array.from(pluginDetectionFileNames).some((fileName) =>
          installedPluginFileNames.value.has(fileName)
        )
      : false;

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
  () =>
    hasCoreSettingChanges.value || pluginIdsToInstall.value.length > 0 || hasInternalBootSelection.value
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
      label: summaryT('activation.unregistered'),
      valid: false,
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-500',
    };
  }

  // Error Mappings
  const errorMap: Record<string, string> = {
    ENOKEYFILE1: summaryT('activation.errors.keyMissing'),
    ENOKEYFILE2: summaryT('activation.errors.validationError'),
    EGUID: summaryT('activation.errors.guidMismatch'),
    EEXPIRED: summaryT('activation.errors.trialExpired'),
    EBLACKLISTED: summaryT('activation.errors.blacklisted'),
  };

  if (typeof state === 'string' && state.startsWith('E')) {
    const label = errorMap[state] || summaryT('activation.errors.generic', { state });
    return {
      label,
      valid: false,
      icon: ExclamationCircleIcon,
      color: 'text-red-500',
    };
  }

  return {
    label: state || summaryT('activation.unknown'),
    valid: false,
    icon: ExclamationCircleIcon,
    color: 'text-gray-400',
  };
});

const handleComplete = async () => {
  if (isProcessing.value) {
    return;
  }
  showBootDriveWarningDialog.value = false;
  if (!canApply.value) {
    error.value = summaryT('status.settingsStillLoading');
    return;
  }

  // Lock modal open
  modalStore.setIsHidden(false);

  isProcessing.value = true;
  error.value = null;
  logs.value = []; // Clear logs

  addLog(summaryT('logs.startingConfiguration'), 'info');
  draftStore.setInternalBootApplySucceeded(false);
  if (showApplyReadinessWarning.value) {
    addLog(summaryT('logs.baselineUnavailable'), 'info');
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
      addLog(summaryT('logs.baselineFallback'), 'info');
    }
    if (shouldApplyPartnerSysModel) {
      addLog(summaryT('logs.applyingPartnerCustomizations'), 'info');
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
    const applyServerIdentityAtEnd = async () => {
      if (!shouldApplyServerIdentity) {
        return;
      }

      addLog(summaryT('logs.updatingServerIdentity', { name: targetCoreSettings.serverName }), 'info');
      try {
        await updateServerIdentity({
          name: targetCoreSettings.serverName,
          comment: targetCoreSettings.serverDescription,
          sysModel: shouldApplyPartnerSysModel ? activationSystemModel.value : undefined,
        });
        addLog(summaryT('logs.serverIdentityUpdated'), 'success');
      } catch (caughtError: unknown) {
        hadNonOptimisticFailures = true;
        hadWarnings = true;
        addErrorLog(summaryT('logs.serverIdentityErrorContinue'), caughtError, {
          operation: 'UpdateServerIdentity',
          variables: {
            name: targetCoreSettings.serverName,
            comment: targetCoreSettings.serverDescription,
            sysModel: shouldApplyPartnerSysModel ? activationSystemModel.value : undefined,
          },
        });
      }
    };

    if (!hasAnyChangesToApply.value) {
      addLog(summaryT('logs.noChanges'), 'info');
    }

    if (shouldApplyTimeZone) {
      addLog(summaryT('logs.settingTimezone', { timeZone: targetCoreSettings.timeZone }), 'info');
      promises.push(
        updateSystemTime({ input: { timeZone: targetCoreSettings.timeZone } })
          .then(() => addLog(summaryT('logs.timezoneUpdated'), 'success'))
          .catch((caughtError: unknown) => {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            addErrorLog(summaryT('logs.timezoneErrorContinue'), caughtError, {
              operation: 'UpdateSystemTime',
              variables: {
                input: {
                  timeZone: targetCoreSettings.timeZone,
                },
              },
            });
          })
      );
    }

    if (shouldApplyTheme) {
      addLog(summaryT('logs.settingTheme', { theme: targetCoreSettings.theme }), 'info');
      promises.push(
        setTheme({ theme: targetCoreSettings.theme })
          .then(() => addLog(summaryT('logs.themeUpdated'), 'success'))
          .catch((caughtError: unknown) => {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            addErrorLog(summaryT('logs.themeErrorContinue'), caughtError, {
              operation: 'SetTheme',
              variables: {
                theme: targetCoreSettings.theme,
              },
            });
          })
      );
    }

    await Promise.all(promises);

    // Install language pack first for non-default locales; only then switch locale.
    if (shouldApplyLocale) {
      const targetLocale = targetCoreSettings.locale;
      if (targetLocale === 'en_US') {
        addLog(summaryT('logs.settingLanguage', { locale: targetLocale }), 'info');
        await setLocale({ locale: targetLocale })
          .then(() => addLog(summaryT('logs.languageUpdated'), 'success'))
          .catch((caughtError: unknown) => {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            addErrorLog(summaryT('logs.languageErrorContinue'), caughtError, {
              operation: 'SetLocale',
              variables: {
                locale: targetLocale,
              },
            });
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
            summaryT('logs.languageMetadataUnavailable', { locale: targetLocale }),
            'error',
            buildOnboardingErrorDiagnostics(
              new Error(summaryT('logs.languageMetadataUnavailable', { locale: targetLocale })),
              {
                operation: 'AvailableLanguages',
                variables: {
                  locale: targetLocale,
                },
              }
            )
          );
        } else {
          addLog(summaryT('logs.installingLanguagePack', { name: language.name }), 'info');
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
                summaryT('logs.languageInstallDidNotSucceed', { name: language.name }),
                'error',
                buildOnboardingErrorDiagnostics(
                  {
                    message: `Language install operation ended with status ${installResult.status}`,
                    code: installResult.status,
                    networkError: {
                      result: installResult,
                    },
                  },
                  {
                    operation: 'InstallLanguage',
                    variables: {
                      forced: false,
                      name: language.name,
                      url: language.url,
                    },
                  }
                )
              );
            } else {
              addLog(summaryT('logs.languagePackInstalled', { name: language.name }), 'success');
              addLog(summaryT('logs.settingLanguage', { locale: targetLocale }), 'info');
              await setLocale({ locale: targetLocale })
                .then(() => addLog(summaryT('logs.languageUpdated'), 'success'))
                .catch((caughtError: unknown) => {
                  hadNonOptimisticFailures = true;
                  hadWarnings = true;
                  addErrorLog(summaryT('logs.languageErrorContinue'), caughtError, {
                    operation: 'SetLocale',
                    variables: {
                      locale: targetLocale,
                    },
                  });
                });
            }
          } catch (caughtError: unknown) {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            hadInstallTimeout = hadInstallTimeout || isInstallTimeoutError(caughtError);
            addErrorLog(
              summaryT('logs.languageInstallFailedKeepLocale', { name: language.name }),
              caughtError,
              {
                operation: 'InstallLanguage',
                variables: {
                  forced: false,
                  name: language.name,
                  url: language.url,
                },
              }
            );
          }
        }
      }
    }

    // 2. Install Plugins
    try {
      await refetchInstalledPlugins();
    } catch (caughtError: unknown) {
      hadWarnings = true;
      addErrorLog(summaryT('logs.refreshPluginsFailedContinue'), caughtError, {
        operation: 'InstalledUnraidPlugins',
      });
    }

    const pluginsToInstall = pluginIdsToInstall.value;
    if (pluginsToInstall.length > 0) {
      addLog(summaryT('logs.installingPlugins', { count: pluginsToInstall.length }), 'info');

      for (const pluginId of pluginsToInstall) {
        const details = pluginMap[pluginId];
        if (details) {
          const detectionFileNames = getPluginInstallDetectionFileNames(details);
          const isInstalled = Array.from(detectionFileNames).some((fileName) =>
            installedPluginFileNames.value.has(fileName)
          );
          if (isInstalled) {
            addLog(summaryT('logs.pluginAlreadyInstalled', { name: details.name }), 'info');
            continue;
          }

          addLog(summaryT('logs.installingPlugin', { name: details.name }), 'info');
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
              addLog(summaryT('logs.pluginInstalled', { name: details.name }), 'success');
            } else {
              hadNonOptimisticFailures = true;
              hadWarnings = true;
              addLog(
                summaryT('logs.pluginInstallFailedContinue', { name: details.name }),
                'error',
                buildOnboardingErrorDiagnostics(
                  {
                    message: `Plugin install operation ended with status ${installResult.status}`,
                    code: installResult.status,
                    networkError: {
                      result: installResult,
                    },
                  },
                  {
                    operation: 'InstallPlugin',
                    variables: {
                      url: details.url,
                      name: details.name,
                      forced: false,
                    },
                  }
                )
              );
            }
          } catch (caughtError: unknown) {
            hadNonOptimisticFailures = true;
            hadWarnings = true;
            hadInstallTimeout = hadInstallTimeout || isInstallTimeoutError(caughtError);
            addErrorLog(
              summaryT('logs.pluginInstallErrorContinue', { name: details.name }),
              caughtError,
              {
                operation: 'InstallPlugin',
                variables: {
                  url: details.url,
                  name: details.name,
                  forced: false,
                },
              }
            );
            // Continue installing others
          }
        }
      }
    }

    // 3. Internal boot setup
    if (internalBootSelection.value) {
      const selection = internalBootSelection.value;
      addLog(summaryT('logs.internalBootStart'), 'info');
      addLog(summaryT('logs.internalBootConfiguring'), 'info');
      const internalBootProgressTimer = setInterval(() => {
        addLog(summaryT('logs.internalBootStillRunning'), 'info');
      }, 10000);
      try {
        const result = await submitInternalBootCreation(
          {
            poolName: selection.poolName,
            devices: selection.devices,
            bootSizeMiB: selection.bootSizeMiB,
            updateBios: selection.updateBios,
          },
          { reboot: false }
        );

        if (result.ok) {
          draftStore.setInternalBootApplySucceeded(true);
          addLog(summaryT('logs.internalBootConfigured'), 'success');
        } else {
          hadNonOptimisticFailures = true;
          hadWarnings = true;
          addLog(
            summaryT('logs.internalBootReturnedError', { output: result.output }),
            'error',
            buildOnboardingErrorDiagnostics(
              {
                message: 'Internal boot setup returned ok=false',
                code: result.code ?? null,
                networkError: {
                  status: result.code ?? null,
                  result,
                },
              },
              {
                operation: 'CreateInternalBootPool',
                variables: {
                  poolName: selection.poolName,
                  devices: selection.devices,
                  bootSizeMiB: selection.bootSizeMiB,
                  updateBios: selection.updateBios,
                  reboot: false,
                },
              }
            )
          );
        }
      } catch (caughtError: unknown) {
        hadNonOptimisticFailures = true;
        hadWarnings = true;
        addErrorLog(summaryT('logs.internalBootFailed'), caughtError, {
          operation: 'CreateInternalBootPool',
          variables: {
            poolName: selection.poolName,
            devices: selection.devices,
            bootSizeMiB: selection.bootSizeMiB,
            updateBios: selection.updateBios,
            reboot: false,
          },
        });
      } finally {
        clearInterval(internalBootProgressTimer);
      }
    }

    // 4. SSH (Run separately and optimistically)
    if (shouldApplySsh) {
      addLog(summaryT('logs.updatingSshSettings'), 'info');
      try {
        const sshUpdateResult = await updateSshSettings({
          enabled: targetCoreSettings.useSsh,
          port: 22,
        });
        const sshVars = getSshVarsFromMutationResult(sshUpdateResult);

        if (isSshStateVerified(sshVars, targetCoreSettings.useSsh, 22)) {
          addLog(summaryT('logs.sshVerified'), 'success');
        } else {
          hadWarnings = true;
          hadSshVerificationUncertainty = true;
          addLog(summaryT('logs.sshVerificationPendingContinue'), 'info');
        }
      } catch (caughtError: unknown) {
        hadWarnings = true;
        hadSshVerificationUncertainty = true;
        addErrorLog(summaryT('logs.sshErrorContinue'), caughtError, {
          operation: 'UpdateSshSettings',
          variables: {
            enabled: targetCoreSettings.useSsh,
            port: 22,
          },
        });
      }
    }

    // 5. Mark Complete
    addLog(summaryT('logs.finalizingSetup'), 'info');

    try {
      await completeOnboarding();
      completionMarked = true;
      cleanupOnboardingStorage({ clearTemporaryBypassSessionState: true });
      addLog(summaryT('logs.setupComplete'), 'success');
    } catch (caughtError: unknown) {
      hadWarnings = true;
      addErrorLog(summaryT('logs.completeOnboardingFailed'), caughtError, {
        operation: 'CompleteOnboarding',
      });
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
      } catch (caughtError: unknown) {
        hadWarnings = true;
        addErrorLog(summaryT('logs.refreshOnboardingFailedContinue'), caughtError, {
          operation: 'OnboardingQuery',
        });
      }
    } else {
      hadWarnings = true;
      addLog(summaryT('logs.skipRefreshApiUnavailable'), 'info');
    }

    await applyServerIdentityAtEnd();

    if (!completionMarked) {
      applyResultSeverity.value = 'warning';
      applyResultTitle.value = summaryT('result.bestEffortTitle');
      applyResultMessage.value = summaryT('result.bestEffortApiOffline');
    } else if (hadInstallTimeout) {
      applyResultSeverity.value = 'warning';
      applyResultTitle.value = summaryT('result.timeoutTitle');
      applyResultMessage.value = summaryT('result.timeoutMessage');
    } else if (hadNonOptimisticFailures) {
      applyResultSeverity.value = 'warning';
      applyResultTitle.value = summaryT('result.warningsTitle');
      applyResultMessage.value = summaryT('result.warningsMessage');
    } else if (hadSshVerificationUncertainty) {
      applyResultSeverity.value = 'warning';
      applyResultTitle.value = summaryT('result.bestEffortTitle');
      applyResultMessage.value = summaryT('result.sshUnverifiedMessage');
    } else if (hadWarnings) {
      applyResultSeverity.value = 'warning';
      applyResultTitle.value = summaryT('result.bestEffortTitle');
      applyResultMessage.value = summaryT('result.bestEffortMessage');
    } else {
      applyResultSeverity.value = 'success';
      applyResultTitle.value = summaryT('result.successTitle');
      applyResultMessage.value = summaryT('result.successMessage');
    }

    isProcessing.value = false;
    showApplyResultDialog.value = true;
  } catch (err: unknown) {
    console.error('Failed to complete onboarding:', err);
    error.value = summaryT('status.setupErrorCheckLogs');
    isProcessing.value = false;
    addLog(
      summaryT('logs.setupFailed'),
      'error',
      buildOnboardingErrorDiagnostics(err, {
        operation: 'ConfirmAndApply',
      })
    );
    applyResultSeverity.value = 'error';
    applyResultTitle.value = summaryT('result.failedTitle');
    applyResultMessage.value = summaryT('result.failedMessage');
    showApplyResultDialog.value = true;
  }
};

const handleApplyResultConfirm = () => {
  showApplyResultDialog.value = false;
  props.onComplete();
};

const handleApplyClick = async () => {
  if (isProcessing.value) {
    return;
  }
  if (hasInternalBootSelection.value) {
    showBootDriveWarningDialog.value = true;
    return;
  }
  await handleComplete();
};

const handleBootDriveWarningConfirm = async () => {
  await handleComplete();
};

const handleBootDriveWarningCancel = () => {
  showBootDriveWarningDialog.value = false;
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
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.coreSettings.serverName') }}</span>
              <span class="text-highlighted font-medium break-all sm:text-right">{{ serverName }}</span>
            </div>
            <div class="bg-elevated flex flex-col rounded text-sm" v-if="draftStore.serverDescription">
              <span class="text-muted">{{ t('onboarding.coreSettings.serverDescription') }}</span>
              <span class="text-highlighted font-medium break-all">{{
                draftStore.serverDescription
              }}</span>
            </div>
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.summaryStep.activationLabel') }}</span>
              <div class="flex items-center gap-1.5 sm:justify-end">
                <component :is="activationStatus.icon" :class="['h-4 w-4', activationStatus.color]" />
                <span class="text-highlighted font-medium break-all">{{ activationStatus.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Networking & Settings Section -->
        <div class="border-muted bg-bg/50 rounded-lg border p-5">
          <div class="mb-4 flex items-center gap-2">
            <GlobeAltIcon class="text-primary h-5 w-5" />
            <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">
              {{ t('onboarding.summaryStep.configuration') }}
            </h3>
          </div>
          <div class="space-y-3">
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.coreSettings.timezone') }}</span>
              <div class="flex items-center gap-1.5 sm:justify-end">
                <ClockIcon class="text-muted h-4 w-4" />
                <span class="text-highlighted font-medium break-all">{{ currentTimeZone }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.coreSettings.ssh') }}</span>
              <div class="flex items-center gap-1.5 sm:justify-end">
                <div :class="[sshEnabled ? 'bg-green-500' : 'bg-gray-400', 'h-2 w-2 rounded-full']" />
                <span class="text-highlighted font-medium break-all">
                  {{
                    sshEnabled
                      ? t('onboarding.summaryStep.sshActive')
                      : t('onboarding.summaryStep.sshInactive')
                  }}
                </span>
              </div>
            </div>
            <!-- Theme & Language -->
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.coreSettings.theme') }}</span>
              <div class="flex items-center gap-1.5 sm:justify-end">
                <SwatchIcon class="text-muted h-4 w-4" />
                <span class="text-highlighted font-medium break-all capitalize">{{ displayTheme }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.coreSettings.language') }}</span>
              <div class="flex items-center gap-1.5 sm:justify-end">
                <LanguageIcon class="text-muted h-4 w-4" />
                <span class="text-highlighted font-medium break-all">{{ displayLanguage }}</span>
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
                <p class="text-muted text-xs">
                  {{ t('onboarding.summaryStep.pluginsSelected', { count: draftPluginsCount }) }}
                </p>
              </div>
            </div>
            <div
              v-if="draftPluginsCount > 0"
              class="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <span v-if="!open">{{ t('onboarding.summaryStep.viewSelected') }}</span>
              <span v-else>{{ t('onboarding.summaryStep.hideSelected') }}</span>
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
                  {{ t('onboarding.summaryStep.noPluginsSelected') }}
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

      <div class="border-muted bg-bg/50 mt-6 rounded-lg border p-5">
        <div class="mb-4 flex items-center gap-2">
          <CircleStackIcon class="text-primary h-5 w-5" />
          <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">
            {{ t('onboarding.summaryStep.bootConfig.title') }}
          </h3>
        </div>
        <div class="space-y-3">
          <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
            <span class="text-muted">{{ t('onboarding.summaryStep.bootConfig.bootMethod') }}</span>
            <span class="text-highlighted font-medium break-all sm:text-right">{{ bootModeLabel }}</span>
          </div>

          <template v-if="internalBootSummary">
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.summaryStep.bootConfig.pool') }}</span>
              <span class="text-highlighted font-medium break-all sm:text-right">{{
                internalBootSummary.poolName
              }}</span>
            </div>
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.summaryStep.bootConfig.slots') }}</span>
              <span class="text-highlighted font-medium break-all sm:text-right">{{
                internalBootSummary.slotCount
              }}</span>
            </div>
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.summaryStep.bootConfig.bootReserved') }}</span>
              <span class="text-highlighted font-medium break-all sm:text-right">{{
                internalBootSummary.bootReservedSize
              }}</span>
            </div>
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.summaryStep.bootConfig.updateBios') }}</span>
              <span class="text-highlighted font-medium break-all sm:text-right">{{
                internalBootSummary.updateBios
                  ? t('onboarding.summaryStep.yes')
                  : t('onboarding.summaryStep.no')
              }}</span>
            </div>
            <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
              <span class="text-muted">{{ t('onboarding.summaryStep.bootConfig.devices') }}</span>
              <div class="flex flex-wrap gap-2 sm:justify-end">
                <span
                  v-for="device in selectedBootDevices"
                  :key="device.id"
                  class="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold break-all"
                >
                  {{ device.label }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Processing / Error Status -->
      <div v-if="showConsole" class="mt-6">
        <OnboardingConsole :logs="logs" :title="t('onboarding.summaryStep.systemSetupLog')" />
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
          {{ t('onboarding.summaryStep.readinessWarning') }}
        </p>
      </div>

      <Dialog
        v-if="showBootDriveWarningDialog"
        :model-value="showBootDriveWarningDialog"
        :show-footer="false"
        :show-close-button="false"
        size="md"
        class="max-w-lg"
      >
        <div class="space-y-6 p-2">
          <div class="space-y-3">
            <h3 class="text-lg font-semibold">{{ t('onboarding.summaryStep.driveWipe.title') }}</h3>
            <p class="text-muted-foreground text-sm">
              {{ t('onboarding.summaryStep.driveWipe.selectedDrives') }}
            </p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="device in selectedBootDevices"
                :key="`dialog-${device.id}`"
                class="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold"
              >
                {{ device.label }}
              </span>
            </div>
            <p class="text-muted-foreground text-sm">
              {{ t('onboarding.summaryStep.driveWipe.confirmPrompt') }}
            </p>
          </div>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="border-muted hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium"
              @click="handleBootDriveWarningCancel"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
              @click="handleBootDriveWarningConfirm"
            >
              {{ t('onboarding.summaryStep.driveWipe.continue') }}
            </button>
          </div>
        </div>
      </Dialog>

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
            <h4 class="text-sm font-semibold tracking-wide uppercase">
              {{ t('onboarding.summaryStep.diagnosticLogs') }}
            </h4>
            <OnboardingConsole :logs="logs" :title="t('onboarding.summaryStep.onboardingDiagnostics')" />
          </div>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
              @click="handleApplyResultConfirm"
            >
              {{ t('onboarding.summaryStep.ok') }}
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
          @click="handleApplyClick"
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
