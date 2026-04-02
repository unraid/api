<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';
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
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/solid';
import { Accordion, BrandButton } from '@unraid/ui';
import { buildBootConfigurationSummaryViewModel } from '@/components/Onboarding/components/bootConfigurationSummary/buildBootConfigurationSummaryViewModel';
import OnboardingBootConfigurationSummary from '@/components/Onboarding/components/bootConfigurationSummary/OnboardingBootConfigurationSummary.vue';
import OnboardingConsole from '@/components/Onboarding/components/OnboardingConsole.vue';
import OnboardingLoadingState from '@/components/Onboarding/components/OnboardingLoadingState.vue';
import OnboardingStepBlockingState from '@/components/Onboarding/components/OnboardingStepBlockingState.vue';
import {
  applyInternalBootSelection,
  getErrorMessage,
} from '@/components/Onboarding/composables/internalBoot';
import { buildOnboardingErrorDiagnostics } from '@/components/Onboarding/composables/onboardingErrorDiagnostics';
import { useOnboardingStepQueryState } from '@/components/Onboarding/composables/useOnboardingStepQueryState';
import usePluginInstaller, {
  INSTALL_OPERATION_TIMEOUT_CODE,
} from '@/components/Onboarding/composables/usePluginInstaller';
import { GET_AVAILABLE_LANGUAGES_QUERY } from '@/components/Onboarding/graphql/availableLanguages.query';
import {
  SET_LOCALE_MUTATION,
  SET_THEME_MUTATION,
  UPDATE_SERVER_IDENTITY_MUTATION,
  UPDATE_SSH_SETTINGS_MUTATION,
} from '@/components/Onboarding/graphql/coreSettings.mutations';
import { GET_CORE_SETTINGS_QUERY } from '@/components/Onboarding/graphql/getCoreSettings.query';
import { INSTALLED_UNRAID_PLUGINS_QUERY } from '@/components/Onboarding/graphql/installedPlugins.query';
import { UPDATE_SERVER_IDENTITY_AND_RESUME_MUTATION } from '@/components/Onboarding/graphql/updateServerIdentityAndResume.mutation';
import { UPDATE_SYSTEM_TIME_MUTATION } from '@/components/Onboarding/graphql/updateSystemTime.mutation';
import { convert } from 'convert';

import type { LogEntry } from '@/components/Onboarding/components/OnboardingConsole.vue';
import type { InternalBootSelection } from '@/components/Onboarding/composables/internalBoot';
import type { OnboardingErrorDiagnostics } from '@/components/Onboarding/composables/onboardingErrorDiagnostics';
import type {
  OnboardingWizardDraft,
  OnboardingWizardInternalBootState,
} from '@/components/Onboarding/onboardingWizardState';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { OnboardingWizardStepId, PluginInstallStatus, ThemeName } from '~/composables/gql/graphql';

export interface Props {
  draft: OnboardingWizardDraft;
  internalBootState: OnboardingWizardInternalBootState;
  onInternalBootStateChange?: (state: OnboardingWizardInternalBootState) => void | Promise<void>;
  onComplete: () => void | Promise<void>;
  onBack?: () => void;
  onCloseOnboarding?: () => void | Promise<void>;
  showBack?: boolean;
  isSavingStep?: boolean;
  saveError?: string | null;
}

const props = defineProps<Props>();
const { t } = useI18n();
const { activationCode, isFreshInstall, registrationState } = storeToRefs(useActivationCodeDataStore());
const draftCoreSettings = computed(() => props.draft.coreSettings ?? {});
const draftPlugins = computed(() => props.draft.plugins?.selectedIds ?? []);
const draftInternalBoot = computed(() => props.draft.internalBoot ?? {});
const internalBootSelection = computed(() => draftInternalBoot.value.selection ?? null);
const setInternalBootState = (state: Partial<OnboardingWizardInternalBootState>) => {
  const nextState: OnboardingWizardInternalBootState = {
    applyAttempted: state.applyAttempted ?? props.internalBootState.applyAttempted,
    applySucceeded: state.applySucceeded ?? props.internalBootState.applySucceeded,
  };
  void props.onInternalBootStateChange?.(nextState);
};
// Setup Mutations
const { mutate: updateSystemTime } = useMutation(UPDATE_SYSTEM_TIME_MUTATION);
const { mutate: updateServerIdentity } = useMutation(UPDATE_SERVER_IDENTITY_MUTATION);
const { mutate: updateServerIdentityAndResume } = useMutation(
  UPDATE_SERVER_IDENTITY_AND_RESUME_MUTATION
);
const { mutate: setTheme } = useMutation(SET_THEME_MUTATION);
const { mutate: setLocale } = useMutation(SET_LOCALE_MUTATION);
const { mutate: updateSshSettings } = useMutation(UPDATE_SSH_SETTINGS_MUTATION);

const { installLanguage, installPlugin } = usePluginInstaller();

// Fetch Current Settings (for comparison if needed)
const {
  result: coreSettingsResult,
  loading: coreSettingsLoading,
  error: coreSettingsError,
  refetch: refetchCoreSettings,
} = useQuery(GET_CORE_SETTINGS_QUERY, null, {
  fetchPolicy: 'cache-first',
});
const {
  result: installedPluginsResult,
  loading: installedPluginsLoading,
  error: installedPluginsError,
  refetch: refetchInstalledPlugins,
} = useQuery(INSTALLED_UNRAID_PLUGINS_QUERY, null, {
  fetchPolicy: 'cache-first',
});
const {
  result: availableLanguagesResult,
  loading: availableLanguagesLoading,
  error: availableLanguagesError,
  refetch: refetchAvailableLanguages,
} = useQuery(GET_AVAILABLE_LANGUAGES_QUERY, null, {
  fetchPolicy: 'cache-first',
});

const draftPluginsCount = computed(() => draftPlugins.value.length);
const hasActiveStorageBootSelection = computed(
  () => draftInternalBoot.value.bootMode === 'storage' && draftInternalBoot.value.skipped !== true
);

const currentTimeZone = computed(() => {
  return (
    draftCoreSettings.value.timeZone ||
    coreSettingsResult.value?.systemTime?.timeZone ||
    t('onboarding.coreSettings.notConfigured')
  );
});

const serverName = computed(() => {
  return (
    draftCoreSettings.value.serverName ||
    coreSettingsResult.value?.vars?.name ||
    t('onboarding.coreSettings.defaultServerName')
  );
});

const activationSystemModel = computed(() => activationCode.value?.system?.model?.trim() || undefined);

const sshEnabled = computed(() => Boolean(draftCoreSettings.value.useSsh));

const displayTheme = computed(() => {
  return draftCoreSettings.value.theme || coreSettingsResult.value?.display?.theme || 'white';
});

const displayLanguage = computed(() => {
  return draftCoreSettings.value.language || coreSettingsResult.value?.display?.locale || 'en_US';
});
const summaryServerDescription = computed(
  () => draftCoreSettings.value.serverDescription || coreSettingsResult.value?.server?.comment || ''
);

const hasInternalBootSelection = computed(() => Boolean(internalBootSelection.value));

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return t('onboarding.internalBootStep.unknownSize');
  }

  const converted = convert(bytes, 'B').to('best', 'metric');
  const precision = converted.quantity >= 100 || converted.unit === 'B' ? 0 : 1;
  return `${converted.quantity.toFixed(precision)} ${converted.unit}`;
};

const toAppliedInternalBootSelection = (
  draft: OnboardingWizardDraft['internalBoot']
): InternalBootSelection | null => {
  if (!draft || draft.bootMode !== 'storage' || draft.skipped === true) {
    return null;
  }

  const selection = draft.selection;
  if (!selection) {
    return null;
  }
  if (
    !selection.poolName ||
    typeof selection.slotCount !== 'number' ||
    !Array.isArray(selection.devices) ||
    typeof selection.bootSizeMiB !== 'number' ||
    typeof selection.updateBios !== 'boolean' ||
    (selection.poolMode !== 'dedicated' && selection.poolMode !== 'hybrid')
  ) {
    return null;
  }

  return {
    poolName: selection.poolName,
    slotCount: selection.slotCount,
    devices: selection.devices.map((device) => device.id),
    bootSizeMiB: selection.bootSizeMiB,
    updateBios: selection.updateBios,
    poolMode: selection.poolMode,
  };
};

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
const applyResultFollowUpMessage = ref<string | null>(null);
const shouldReloadAfterApplyResult = ref(false);
const redirectUrlAfterApplyResult = ref<string | null>(null);
const isTransitioningAfterApplyResult = ref(false);
const summaryT = (key: string, values?: Record<string, unknown>) =>
  t(`onboarding.summaryStep.${key}`, values ?? {});
const localApplyError = computed(() => error.value ?? null);
const saveTransitionError = computed(() => props.saveError ?? null);

const addLog = (
  message: string,
  type: LogEntry['type'] = 'info',
  details?: OnboardingErrorDiagnostics
) => {
  logs.value.push({ message, type, timestamp: Date.now(), details });
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
const selectedBootDevices = computed(() =>
  bootConfigurationSummaryState.value.kind === 'ready'
    ? bootConfigurationSummaryState.value.summary.devices
    : []
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

const NETWORK_RECOVERY_MAX_ATTEMPTS = 4;
const NETWORK_RECOVERY_RETRY_MS = 1000;
const NETWORK_ERROR_PATTERNS = [
  'networkerror when attempting to fetch resource',
  'failed to fetch',
  'network error',
  'ns_error_connection_refused',
  'connection refused',
];

const hasNetworkLikeMessage = (message: string) => {
  const normalized = message.toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
};

const isTransientNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    message?: unknown;
    networkError?: unknown;
    cause?: unknown;
  };

  if (candidate.networkError) {
    return true;
  }

  if (typeof candidate.message === 'string' && hasNetworkLikeMessage(candidate.message)) {
    return true;
  }

  if (candidate.cause instanceof Error && hasNetworkLikeMessage(candidate.cause.message)) {
    return true;
  }

  return false;
};

const sleepMs = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const runWithTransientNetworkRetry = async <T,>(
  operation: () => Promise<T>,
  enabled: boolean
): Promise<T> => {
  if (!enabled) {
    return operation();
  }

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= NETWORK_RECOVERY_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (caughtError: unknown) {
      lastError = caughtError;
      const shouldRetry =
        isTransientNetworkError(caughtError) && attempt < NETWORK_RECOVERY_MAX_ATTEMPTS;
      if (!shouldRetry) {
        throw caughtError;
      }

      await sleepMs(NETWORK_RECOVERY_RETRY_MS);
    }
  }

  throw lastError;
};

const normalizeLocationHostname = (hostname: string): string => {
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1);
  }

  return hostname;
};

const isIpv4Literal = (hostname: string): boolean => {
  const parts = hostname.split('.');
  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
};

const isIpv6Literal = (hostname: string): boolean =>
  hostname.includes(':') && /^[\da-f:.]+$/i.test(hostname);

const shouldRedirectAfterRename = (hostname: string): boolean => {
  const normalizedHostname = normalizeLocationHostname(hostname);
  return !isIpv4Literal(normalizedHostname) && !isIpv6Literal(normalizedHostname);
};

const buildRedirectUrl = (baseUrl: string): string => {
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const targetUrl = new URL(currentPath, baseUrl);
  return targetUrl.toString();
};

const buildResumeDraftInput = (expectedServerName: string) => ({
  draft: props.draft,
  navigation: {
    currentStepId: OnboardingWizardStepId.NEXT_STEPS,
  },
  internalBootState: props.internalBootState,
  expectedServerName,
});

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
  serverName: draftCoreSettings.value.serverName || TRUSTED_DEFAULT_PROFILE.serverName,
  serverDescription:
    draftCoreSettings.value.serverDescription || TRUSTED_DEFAULT_PROFILE.serverDescription,
  timeZone: draftCoreSettings.value.timeZone || TRUSTED_DEFAULT_PROFILE.timeZone,
  theme: normalizeThemeName(draftCoreSettings.value.theme || TRUSTED_DEFAULT_PROFILE.theme),
  locale: draftCoreSettings.value.language || TRUSTED_DEFAULT_PROFILE.locale,
  useSsh:
    typeof draftCoreSettings.value.useSsh === 'boolean'
      ? draftCoreSettings.value.useSsh
      : TRUSTED_DEFAULT_PROFILE.useSsh,
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
  return draftPlugins.value.filter((pluginId) => {
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
  return draftPlugins.value.map((pluginId) => {
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

const isApplyDataReady = computed(
  () =>
    Boolean(coreSettingsResult.value?.server && coreSettingsResult.value?.vars) &&
    Array.isArray(installedPluginsResult.value?.installedUnraidPlugins) &&
    Array.isArray(availableLanguagesResult.value?.customization?.availableLanguages)
);
const {
  isStepQueryLoading,
  retryQueries: handleRetryQueries,
  stepQueryError,
} = useOnboardingStepQueryState({
  errors: [coreSettingsError, installedPluginsError, availableLanguagesError],
  loadings: [coreSettingsLoading, installedPluginsLoading, availableLanguagesLoading],
  ready: isApplyDataReady,
  retry: () =>
    Promise.all([refetchCoreSettings(), refetchInstalledPlugins(), refetchAvailableLanguages()]),
});
const bootConfigurationSummaryState = computed(() =>
  buildBootConfigurationSummaryViewModel(draftInternalBoot.value, {
    labels: {
      title: t('onboarding.summaryStep.bootConfig.title'),
      bootMethod: t('onboarding.summaryStep.bootConfig.bootMethod'),
      bootMethodStorage: t('onboarding.summaryStep.bootConfig.bootMethodStorage'),
      bootMethodUsb: t('onboarding.summaryStep.bootConfig.bootMethodUsb'),
      poolMode: t('onboarding.summaryStep.bootConfig.poolMode'),
      poolModeDedicated: t('onboarding.summaryStep.bootConfig.poolModeDedicated'),
      poolModeHybrid: t('onboarding.summaryStep.bootConfig.poolModeHybrid'),
      pool: t('onboarding.summaryStep.bootConfig.pool'),
      slots: t('onboarding.summaryStep.bootConfig.slots'),
      bootReserved: t('onboarding.summaryStep.bootConfig.bootReserved'),
      updateBios: t('onboarding.summaryStep.bootConfig.updateBios'),
      devices: t('onboarding.summaryStep.bootConfig.devices'),
      yes: t('onboarding.summaryStep.yes'),
      no: t('onboarding.summaryStep.no'),
    },
    formatBootSize: (bootSizeMiB) =>
      bootSizeMiB === 0
        ? t('onboarding.internalBootStep.bootSize.wholeDrive')
        : t('onboarding.internalBootStep.bootSize.gbLabel', { size: Math.round(bootSizeMiB / 1024) }),
    formatDeviceSize: formatBytes,
    missingStorageSelectionBehavior: 'hidden',
  })
);
const hasInvalidBootConfiguration = computed(
  () => bootConfigurationSummaryState.value.kind === 'invalid'
);
const bootConfigurationInvalidMessage = computed(() => summaryT('bootConfig.invalid'));
const canApply = computed(() => !hasInvalidBootConfiguration.value && isApplyDataReady.value);
const isBusy = computed(() => isProcessing.value || Boolean(props.isSavingStep));

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

  isProcessing.value = true;
  error.value = null;
  logs.value = []; // Clear logs
  applyResultFollowUpMessage.value = null;
  isTransitioningAfterApplyResult.value = false;
  shouldReloadAfterApplyResult.value = false;
  redirectUrlAfterApplyResult.value = null;

  addLog(summaryT('logs.startingConfiguration'), 'info');
  setInternalBootState({
    applyAttempted: props.internalBootState.applyAttempted,
    applySucceeded: false,
  });

  try {
    const promises = [];
    const targetCoreSettings = resolveTargetCoreSettings();
    let hadNonOptimisticFailures = false;
    let hadWarnings = false;
    let hadSshVerificationUncertainty = false;
    let hadInstallTimeout = false;

    // 1. Apply Core Settings
    const currentTimezone =
      coreSettingsResult.value?.systemTime?.timeZone || TRUSTED_DEFAULT_PROFILE.timeZone;
    const currentName =
      coreSettingsResult.value?.server?.name ||
      coreSettingsResult.value?.vars?.name ||
      TRUSTED_DEFAULT_PROFILE.serverName;
    const currentDescription =
      coreSettingsResult.value?.server?.comment || TRUSTED_DEFAULT_PROFILE.serverDescription;
    const currentTheme = coreSettingsResult.value?.display?.theme || TRUSTED_DEFAULT_PROFILE.theme;
    const currentLocale = coreSettingsResult.value?.display?.locale || TRUSTED_DEFAULT_PROFILE.locale;
    const currentSsh = Boolean(coreSettingsResult.value?.vars?.useSsh || false);
    const currentSysModel = coreSettingsResult.value?.vars?.sysModel || '';
    const serverNameChanged = targetCoreSettings.serverName !== currentName;
    const shouldApplyPartnerSysModel = Boolean(
      isFreshInstall.value &&
        activationSystemModel.value &&
        activationSystemModel.value !== currentSysModel
    );

    if (shouldApplyPartnerSysModel) {
      addLog(summaryT('logs.applyingPartnerCustomizations'), 'info');
    }

    const shouldApplyTimeZone = targetCoreSettings.timeZone !== currentTimezone;
    const shouldApplyServerIdentity =
      targetCoreSettings.serverName !== currentName ||
      targetCoreSettings.serverDescription !== currentDescription ||
      shouldApplyPartnerSysModel;
    const shouldApplyTheme = targetCoreSettings.theme !== currentTheme;
    const shouldApplyLocale = targetCoreSettings.locale !== currentLocale;
    const shouldApplySsh = targetCoreSettings.useSsh !== currentSsh;
    const shouldRetryNetworkMutations = shouldApplySsh;
    const applyServerIdentityAtEnd = async () => {
      if (!shouldApplyServerIdentity) {
        return;
      }

      addLog(summaryT('logs.updatingServerIdentity', { name: targetCoreSettings.serverName }), 'info');
      try {
        const result = await runWithTransientNetworkRetry(() => {
          if (serverNameChanged) {
            // Write the resume step on the same request as the rename so the
            // server-owned tracker survives cert prompts and re-login.
            return updateServerIdentityAndResume({
              name: targetCoreSettings.serverName,
              comment: targetCoreSettings.serverDescription,
              sysModel: shouldApplyPartnerSysModel ? activationSystemModel.value : undefined,
              input: buildResumeDraftInput(targetCoreSettings.serverName),
            });
          }

          return updateServerIdentity({
            name: targetCoreSettings.serverName,
            comment: targetCoreSettings.serverDescription,
            sysModel: shouldApplyPartnerSysModel ? activationSystemModel.value : undefined,
          });
        }, shouldRetryNetworkMutations);
        if (serverNameChanged) {
          const renameResult = result?.data?.updateServerIdentity;
          const saveOnboardingDraftResult =
            result?.data && 'onboarding' in result.data
              ? result.data.onboarding?.saveOnboardingDraft
              : undefined;

          if (saveOnboardingDraftResult === false) {
            hadWarnings = true;
            addLog(summaryT('logs.serverIdentityResumePending'), 'info');
          }
          applyResultFollowUpMessage.value = summaryT('result.renameFollowUpMessage');
          const redirectBaseUrl = useReturnedDefaultUrlAfterRename
            ? renameResult?.defaultUrl
            : location.origin;
          if (!redirectBaseUrl) {
            throw new Error('Server rename succeeded but no redirect target was available');
          }

          redirectUrlAfterApplyResult.value = buildRedirectUrl(redirectBaseUrl);
          shouldReloadAfterApplyResult.value = true;
        }
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

    const pluginsToInstall = pluginIdsToInstall.value;
    const hasUpdatesToApply =
      shouldApplyTimeZone ||
      shouldApplyServerIdentity ||
      shouldApplyTheme ||
      shouldApplyLocale ||
      shouldApplySsh ||
      pluginsToInstall.length > 0 ||
      Boolean(internalBootSelection.value);

    if (!hasUpdatesToApply) {
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
    if (hasActiveStorageBootSelection.value) {
      const selection = toAppliedInternalBootSelection(draftInternalBoot.value);
      if (!selection) {
        throw new Error('Internal boot selection is incomplete');
      }
      setInternalBootState({
        applyAttempted: true,
        applySucceeded: false,
      });
      addLog(summaryT('logs.internalBootStart'), 'info');
      addLog(summaryT('logs.internalBootConfiguring'), 'info');
      const internalBootProgressTimer = setInterval(() => {
        addLog(summaryT('logs.internalBootStillRunning'), 'info');
      }, 10000);
      try {
        const applyResult = await applyInternalBootSelection(selection, {
          configured: summaryT('logs.internalBootConfigured'),
          returnedError: (output) => summaryT('logs.internalBootReturnedError', { output }),
          failed: summaryT('logs.internalBootFailed'),
          biosUnverified: summaryT('logs.internalBootBiosUnverified'),
        });

        if (applyResult.applySucceeded) {
          setInternalBootState({
            applyAttempted: true,
            applySucceeded: true,
          });
        }

        hadWarnings ||= applyResult.hadWarnings;
        hadNonOptimisticFailures ||= applyResult.hadNonOptimisticFailures;

        for (const log of applyResult.logs) {
          addLog(log.message, log.type, log.details);
        }
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

    await applyServerIdentityAtEnd();
    addLog(summaryT('logs.finalizingSetup'), 'info');

    if (hadInstallTimeout) {
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
    } else if (!hasUpdatesToApply) {
      applyResultSeverity.value = 'success';
      applyResultTitle.value = summaryT('result.noChangesTitle');
      applyResultMessage.value = summaryT('result.noChangesMessage');
    } else {
      addLog(summaryT('logs.settingsApplied'), 'success');
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

const handleApplyResultConfirm = async () => {
  showApplyResultDialog.value = false;
  if (!shouldReloadAfterApplyResult.value) {
    await Promise.resolve(props.onComplete());
    return;
  }

  isTransitioningAfterApplyResult.value = true;
  const redirectUrl = redirectUrlAfterApplyResult.value;
  shouldReloadAfterApplyResult.value = false;
  redirectUrlAfterApplyResult.value = null;
  let navigationTriggered = false;
  try {
    await nextTick();
    if (redirectUrl) {
      navigationTriggered = true;
      location.replace(redirectUrl);
      return;
    }

    navigationTriggered = true;
    location.reload();
  } finally {
    if (!navigationTriggered) {
      isTransitioningAfterApplyResult.value = false;
    }
  }
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
    <OnboardingLoadingState
      v-if="props.isSavingStep || isTransitioningAfterApplyResult"
      :title="
        isTransitioningAfterApplyResult ? summaryT('transition.title') : t('onboarding.loading.title')
      "
      :description="
        isTransitioningAfterApplyResult
          ? summaryT('transition.description')
          : t('onboarding.loading.description')
      "
    />

    <div v-else class="bg-elevated border-muted rounded-xl border p-6 text-left shadow-sm md:p-10">
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

      <!-- Initialization Message -->
      <UAlert
        color="success"
        variant="subtle"
        :title="t('onboarding.summaryStep.initializationMessage')"
        icon="i-heroicons-check-circle"
        class="my-8"
      />

      <OnboardingStepBlockingState
        v-if="saveTransitionError"
        :title="saveTransitionError"
        :description="t('onboarding.stepSaveFailure.description')"
        :secondary-action-text="t('onboarding.modal.exit.confirm')"
        :on-secondary-action="props.onCloseOnboarding"
      />

      <OnboardingLoadingState
        v-else-if="isStepQueryLoading"
        :title="t('onboarding.loading.title')"
        :description="t('onboarding.summaryStep.loadingDescription')"
      />

      <OnboardingStepBlockingState
        v-else-if="stepQueryError"
        root-test-id="onboarding-step-query-error"
        :title="t('onboarding.stepQueryGate.errorTitle')"
        :description="t('onboarding.stepQueryGate.errorDescription')"
        :primary-action-text="t('common.retry')"
        primary-test-id="onboarding-step-query-retry"
        :secondary-action-text="t('onboarding.modal.exit.confirm')"
        secondary-test-id="onboarding-step-query-close"
        :on-primary-action="handleRetryQueries"
        :on-secondary-action="props.onCloseOnboarding"
      />

      <template v-else>
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
                <span class="text-highlighted font-medium break-all sm:text-right">{{
                  serverName
                }}</span>
              </div>
              <div v-if="summaryServerDescription" class="space-y-1">
                <span class="text-muted">{{ t('onboarding.coreSettings.serverDescription') }}</span>
                <div
                  class="border-muted bg-accented text-toned mt-1 min-h-10 w-full rounded-md border px-3 py-2 text-sm font-medium break-all"
                  aria-readonly="true"
                >
                  {{ summaryServerDescription }}
                </div>
              </div>
              <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
                <span class="text-muted">{{ t('onboarding.summaryStep.activationLabel') }}</span>
                <div class="flex items-center gap-1.5 sm:justify-end">
                  <component :is="activationStatus.icon" :class="['h-4 w-4', activationStatus.color]" />
                  <span class="text-highlighted font-medium break-all">{{
                    activationStatus.label
                  }}</span>
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
                  <span class="text-highlighted font-medium break-all capitalize">{{
                    displayTheme
                  }}</span>
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
          <Accordion
            :items="[
              {
                value: 'plugins',
                title: t('onboarding.pluginsStep.title'),
                disabled: draftPluginsCount === 0,
              },
            ]"
            type="single"
            collapsible
            class="border-none"
            item-class="border-none"
            trigger-class="pr-4 hover:no-underline [&>svg]:text-primary"
          >
            <template #trigger="{ open }">
              <div
                :class="[
                  'flex w-full items-center justify-between px-3 text-left focus:outline-none',
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
                </div>
              </div>
            </template>
            <template #content>
              <div class="px-5 pt-0 pb-5">
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
              </div>
            </template>
          </Accordion>
        </div>

        <div v-if="bootConfigurationSummaryState.kind === 'ready'" class="mt-6">
          <OnboardingBootConfigurationSummary :summary="bootConfigurationSummaryState.summary" />
        </div>

        <div
          v-else-if="bootConfigurationSummaryState.kind === 'invalid'"
          data-testid="boot-configuration-summary-invalid"
          class="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/10"
        >
          <p class="text-sm font-medium text-amber-700 dark:text-amber-300">
            {{ bootConfigurationInvalidMessage }}
          </p>
        </div>

        <!-- Processing / Error Status -->
        <div v-if="showConsole" class="mt-6">
          <OnboardingConsole :logs="logs" :title="t('onboarding.summaryStep.systemSetupLog')" />
        </div>

        <div
          v-if="localApplyError"
          class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
        >
          <p class="text-center text-sm font-medium text-red-600 dark:text-red-400">
            {{ localApplyError }}
          </p>
        </div>

        <UModal
          :open="showBootDriveWarningDialog"
          :portal="false"
          :title="t('onboarding.summaryStep.driveWipe.title')"
          :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50 max-w-lg' }"
          @update:open="showBootDriveWarningDialog = $event"
        >
          <template #body>
            <div class="space-y-3">
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
          </template>
          <template #footer>
            <UButton color="neutral" variant="outline" @click="handleBootDriveWarningCancel">
              {{ t('common.cancel') }}
            </UButton>
            <UButton @click="handleBootDriveWarningConfirm">
              {{ t('onboarding.summaryStep.driveWipe.continue') }}
            </UButton>
          </template>
        </UModal>

        <UModal
          :open="showApplyResultDialog"
          :dismissible="false"
          :close="false"
          :portal="false"
          :title="applyResultTitle"
          :description="applyResultMessage"
          :ui="{
            footer: 'justify-end',
            overlay: 'z-50',
            content: showDiagnosticLogsInResultDialog
              ? 'z-50 w-[calc(100vw-2rem)] max-w-3xl'
              : 'z-50 max-w-md',
          }"
        >
          <template v-if="showDiagnosticLogsInResultDialog" #body>
            <div class="space-y-3">
              <h4 class="text-sm font-semibold tracking-wide uppercase">
                {{ t('onboarding.summaryStep.diagnosticLogs') }}
              </h4>
              <OnboardingConsole
                :logs="logs"
                :title="t('onboarding.summaryStep.onboardingDiagnostics')"
              />
            </div>
          </template>
          <template #footer>
            <UButton @click="handleApplyResultConfirm">
              {{ t('onboarding.summaryStep.ok') }}
            </UButton>
          </template>
        </UModal>

      <UModal
        :open="showApplyResultDialog"
        :dismissible="false"
        :close="false"
        :portal="false"
        :title="applyResultTitle"
        :description="applyResultMessage"
        :ui="{
          footer: 'justify-end',
          overlay: 'z-50',
          content: showDiagnosticLogsInResultDialog
            ? 'z-50 w-[calc(100vw-2rem)] max-w-3xl'
            : 'z-50 max-w-md',
        }"
      >
        <template v-if="showDiagnosticLogsInResultDialog || applyResultFollowUpMessage" #body>
          <div class="space-y-3">
            <UAlert
              v-if="applyResultFollowUpMessage"
              color="neutral"
              variant="subtle"
              :description="applyResultFollowUpMessage"
              icon="i-heroicons-information-circle"
            />
            <template v-if="showDiagnosticLogsInResultDialog">
              <h4 class="text-sm font-semibold tracking-wide uppercase">
                {{ t('onboarding.summaryStep.diagnosticLogs') }}
              </h4>
              <OnboardingConsole
                :logs="logs"
                :title="t('onboarding.summaryStep.onboardingDiagnostics')"
              />
            </template>
          </div>
        </template>
        <template #footer>
          <UButton @click="handleApplyResultConfirm">
            {{ t('onboarding.summaryStep.ok') }}
          </UButton>
        </template>
      </UModal>

      <!-- Footer -->
      <div
        class="border-muted mt-8 flex flex-col-reverse items-center justify-between gap-6 border-t pt-8 sm:flex-row"
      >
          <button
            v-if="showBack"
            @click="handleBack"
            class="text-muted hover:text-toned group flex items-center justify-center gap-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:justify-start"
            :disabled="isBusy"
          >
            <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            {{ t('common.back') }}
          </button>
          <div v-else class="hidden w-1 sm:block" />

          <BrandButton
            :text="''"
            :class="`w-full min-w-[200px] font-bold tracking-wide uppercase shadow-md transition-all sm:w-auto ${
              isBusy
                ? '!bg-gray-400 !text-white hover:!bg-gray-400'
                : '!bg-primary hover:!bg-primary/90 !text-white hover:shadow-lg'
            }`"
            @click="handleApplyClick"
            :disabled="isBusy || !canApply"
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
      </template>
    </div>
  </div>
</template>
