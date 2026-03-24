<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { ChevronLeftIcon, CircleStackIcon } from '@heroicons/vue/24/outline';
import { ArrowPathIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/solid';
import { Accordion, BrandButton } from '@unraid/ui';
import OnboardingLoadingState from '@/components/Onboarding/components/OnboardingLoadingState.vue';
import { REFRESH_INTERNAL_BOOT_CONTEXT_MUTATION } from '@/components/Onboarding/graphql/refreshInternalBootContext.mutation';
import { useOnboardingDraftStore } from '@/components/Onboarding/store/onboardingDraft';
import { convert } from 'convert';

import type {
  OnboardingBootMode,
  OnboardingInternalBootSelection,
} from '@/components/Onboarding/store/onboardingDraft';
import type { GetInternalBootContextQuery } from '~/composables/gql/graphql';

import { GetInternalBootContextDocument } from '~/composables/gql/graphql';

export interface Props {
  onComplete: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  showSkip?: boolean;
  showBack?: boolean;
  isSavingStep?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();
const draftStore = useOnboardingDraftStore();
const toBootMode = (value: unknown): OnboardingBootMode => (value === 'storage' ? 'storage' : 'usb');

interface InternalBootDeviceOption {
  value: string;
  label: string;
  device: string;
  sizeMiB: number | null;
  ineligibilityCodes: InternalBootDiskEligibilityCode[];
  warningCodes: InternalBootDiskWarningCode[];
}

interface InternalBootTemplateData {
  poolNameDefault: string;
  slotOptions: number[];
  deviceOptions: InternalBootDeviceOption[];
  bootSizePresetsMiB: number[];
  defaultBootSizeMiB: number;
  defaultUpdateBios: boolean;
  reservedNames: string[];
  shareNames: string[];
  poolNames: string[];
}

interface SelectMenuItem {
  value: string | number;
  label: string;
  disabled?: boolean;
}

type InternalBootTransferState = 'enabled' | 'disabled' | 'unknown';
type InternalBootEligibilityState = 'eligible' | 'ineligible' | 'unknown';
type InternalBootSystemEligibilityCode =
  | 'NO_UNASSIGNED_DISKS'
  | 'ENABLE_BOOT_TRANSFER_DISABLED'
  | 'ENABLE_BOOT_TRANSFER_UNKNOWN'
  | 'BOOT_ELIGIBLE_FALSE'
  | 'BOOT_ELIGIBLE_UNKNOWN';
type InternalBootDiskEligibilityCode = 'TOO_SMALL';
type InternalBootDiskWarningCode = 'HAS_INTERNAL_BOOT_PARTITIONS';
type InternalBootDiskIssueCode = InternalBootDiskEligibilityCode | InternalBootDiskWarningCode;

const MIN_BOOT_SIZE_MIB = 4096;
const MIN_ELIGIBLE_DEVICE_SIZE_MIB = MIN_BOOT_SIZE_MIB * 2;
const DEFAULT_BOOT_SIZE_MIB = 16384;
const BOOT_SIZE_PRESETS_MIB = [16384, 32768, 65536, 131072];
const SYSTEM_ELIGIBILITY_MESSAGE_KEYS: Record<InternalBootSystemEligibilityCode, string> = {
  NO_UNASSIGNED_DISKS: 'onboarding.internalBootStep.eligibility.codes.NO_UNASSIGNED_DISKS',
  ENABLE_BOOT_TRANSFER_DISABLED:
    'onboarding.internalBootStep.eligibility.codes.ENABLE_BOOT_TRANSFER_DISABLED',
  ENABLE_BOOT_TRANSFER_UNKNOWN:
    'onboarding.internalBootStep.eligibility.codes.ENABLE_BOOT_TRANSFER_UNKNOWN',
  BOOT_ELIGIBLE_FALSE: 'onboarding.internalBootStep.eligibility.codes.BOOT_ELIGIBLE_FALSE',
  BOOT_ELIGIBLE_UNKNOWN: 'onboarding.internalBootStep.eligibility.codes.BOOT_ELIGIBLE_UNKNOWN',
};
const DISK_ISSUE_MESSAGE_KEYS: Record<InternalBootDiskIssueCode, string> = {
  TOO_SMALL: 'onboarding.internalBootStep.eligibility.codes.TOO_SMALL',
  HAS_INTERNAL_BOOT_PARTITIONS:
    'onboarding.internalBootStep.eligibility.codes.HAS_INTERNAL_BOOT_PARTITIONS',
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return t('onboarding.internalBootStep.unknownSize');
  }

  const converted = convert(bytes, 'B').to('best', 'metric');
  const precision = converted.quantity >= 100 || converted.unit === 'B' ? 0 : 1;
  return `${converted.quantity.toFixed(precision)} ${converted.unit}`;
};

const toSizeMiB = (bytes: number): number | null => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }
  return Math.floor(bytes / 1024 / 1024);
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

const buildDeviceLabel = (displayId: string, sizeLabel: string, device: string): string => {
  if (displayId === device) {
    return `${displayId} - ${sizeLabel}`;
  }

  return `${displayId} - ${sizeLabel} (${device})`;
};

const {
  result: contextResult,
  loading: contextLoading,
  error: contextError,
  refetch: refetchContext,
} = useQuery(GetInternalBootContextDocument, null, {
  fetchPolicy: 'network-only',
});
const { mutate: refreshInternalBootContextMutation } = useMutation(
  REFRESH_INTERNAL_BOOT_CONTEXT_MUTATION
);

const formError = ref<string | null>(null);
const hasInitializedForm = ref(false);
const isRefreshingContext = ref(false);
const bootMode = ref<OnboardingBootMode>(
  toBootMode(draftStore.bootMode ?? (draftStore.internalBootSelection ? 'storage' : 'usb'))
);

const poolName = ref('boot');
const slotCount = ref(1);
const selectedDevices = ref<string[]>(['']);
const bootSizePreset = ref<string>('');
const customBootSizeGb = ref('');
const updateBios = ref(true);

const internalBootContext = computed(() => contextResult.value?.internalBootContext ?? null);

const templateData = computed<InternalBootTemplateData | null>(() => {
  const data: GetInternalBootContextQuery['internalBootContext'] | null = internalBootContext.value;
  if (!data) {
    return null;
  }

  const deviceOptions = data.assignableDisks
    .map<InternalBootDeviceOption>((disk) => {
      const device = normalizeDeviceName(disk.device);
      const sizeBytes = disk.size;
      const sizeMiB = toSizeMiB(sizeBytes);
      const ineligibilityCodes: InternalBootDiskEligibilityCode[] = [];
      const warningCodes: InternalBootDiskWarningCode[] = [];

      if (sizeMiB !== null && sizeMiB < MIN_ELIGIBLE_DEVICE_SIZE_MIB) {
        ineligibilityCodes.push('TOO_SMALL');
      }

      const serialNum = disk.serialNum?.trim() || '';
      const diskId = disk.id?.trim() || '';
      const optionValue = serialNum || diskId || device;
      const displayId = serialNum || device;
      const sizeLabel = formatBytes(sizeBytes);
      const matchingDriveWarning = data.driveWarnings.find(
        (warning) => warning.diskId === diskId || normalizeDeviceName(warning.device) === device
      );
      if (matchingDriveWarning?.warnings.includes('HAS_INTERNAL_BOOT_PARTITIONS')) {
        warningCodes.push('HAS_INTERNAL_BOOT_PARTITIONS');
      }
      return {
        value: optionValue,
        label: buildDeviceLabel(displayId, sizeLabel, device),
        device,
        sizeMiB,
        ineligibilityCodes,
        warningCodes,
      };
    })
    .filter((disk) => disk.device.length > 0);

  const poolNameSet = new Set<string>();
  for (const poolNameValue of data.poolNames) {
    const poolName = poolNameValue?.trim() || '';
    if (poolName) {
      poolNameSet.add(poolName);
    }
  }

  const reservedNameSet = new Set<string>();
  for (const reservedName of data.reservedNames) {
    const name = reservedName.trim();
    if (name) {
      reservedNameSet.add(name);
    }
  }

  const shareNameSet = new Set<string>();
  for (const shareName of data.shareNames) {
    const name = shareName?.trim() || '';
    if (name) {
      shareNameSet.add(name);
    }
  }

  return {
    poolNameDefault: poolNameSet.size === 0 ? 'cache' : '',
    slotOptions: [1, 2],
    deviceOptions,
    bootSizePresetsMiB: BOOT_SIZE_PRESETS_MIB,
    defaultBootSizeMiB: DEFAULT_BOOT_SIZE_MIB,
    defaultUpdateBios: true,
    reservedNames: Array.from(reservedNameSet),
    shareNames: Array.from(shareNameSet),
    poolNames: Array.from(poolNameSet),
  };
});

const isLoading = computed(() => Boolean(contextLoading.value) && !internalBootContext.value);
const isBusy = computed(() => Boolean(props.isSavingStep) || isLoading.value);
const isStepLocked = computed(() => Boolean(props.isSavingStep));
const internalBootTransferState = computed<InternalBootTransferState>(() => {
  const setting = internalBootContext.value?.enableBootTransfer;
  if (typeof setting !== 'string') {
    return 'unknown';
  }

  const normalizedSetting = setting.trim().toLowerCase();
  if (normalizedSetting === 'yes') {
    return 'enabled';
  }
  if (normalizedSetting === 'no') {
    return 'disabled';
  }
  return 'unknown';
});
const bootEligibilityState = computed<InternalBootEligibilityState>(() => {
  const eligibility = internalBootContext.value?.bootEligible;
  if (eligibility === true) {
    return 'eligible';
  }
  if (eligibility === false) {
    return 'ineligible';
  }
  return 'unknown';
});
const allDeviceOptions = computed(() => templateData.value?.deviceOptions ?? []);
const deviceOptions = computed(() =>
  allDeviceOptions.value.filter((option) => option.ineligibilityCodes.length === 0)
);
const slotOptions = computed(() => templateData.value?.slotOptions ?? [1, 2]);
const reservedNames = computed(() => new Set(templateData.value?.reservedNames ?? []));
const shareNames = computed(() => new Set(templateData.value?.shareNames ?? []));
const existingPoolNames = computed(() => new Set(templateData.value?.poolNames ?? []));
const systemEligibilityCodes = computed<InternalBootSystemEligibilityCode[]>(() => {
  const codes: InternalBootSystemEligibilityCode[] = [];

  if (internalBootTransferState.value === 'disabled') {
    codes.push('ENABLE_BOOT_TRANSFER_DISABLED');
  }
  if (internalBootTransferState.value === 'unknown') {
    codes.push('ENABLE_BOOT_TRANSFER_UNKNOWN');
  }
  if (bootEligibilityState.value === 'ineligible') {
    codes.push('BOOT_ELIGIBLE_FALSE');
  }
  if (bootEligibilityState.value === 'unknown') {
    codes.push('BOOT_ELIGIBLE_UNKNOWN');
  }
  if (allDeviceOptions.value.length === 0) {
    codes.push('NO_UNASSIGNED_DISKS');
  }

  return codes;
});
const diskEligibilityIssues = computed(() =>
  allDeviceOptions.value
    .filter((option) => option.ineligibilityCodes.length > 0 || option.warningCodes.length > 0)
    .map((option) => ({
      label: option.label,
      codes: [...option.ineligibilityCodes, ...option.warningCodes],
    }))
);
const selectedDriveWarnings = computed(() =>
  selectedDevices.value
    .map((selectedDevice) => allDeviceOptions.value.find((option) => option.value === selectedDevice))
    .filter((option): option is InternalBootDeviceOption => Boolean(option))
    .filter((option) => option.warningCodes.length > 0)
);

const canConfigure = computed(
  () =>
    internalBootTransferState.value === 'enabled' &&
    bootEligibilityState.value === 'eligible' &&
    deviceOptions.value.length > 0
);
const hasEligibleDevices = computed(() => deviceOptions.value.length > 0);
const hasNoEligibleDevices = computed(() => !hasEligibleDevices.value);
const isStorageBootSelected = computed(() => bootMode.value === 'storage');
const isPrimaryActionDisabled = computed(
  () => isStepLocked.value || (isStorageBootSelected.value && (isLoading.value || !canConfigure.value))
);
const isPrimaryActionLoading = computed(
  () => isStepLocked.value || (isStorageBootSelected.value && isLoading.value)
);
const shouldShowEligibilityDetails = computed(
  () =>
    !contextError.value &&
    (systemEligibilityCodes.value.length > 0 || diskEligibilityIssues.value.length > 0)
);
const eligibilityPanelTitle = computed(() =>
  canConfigure.value
    ? t('onboarding.internalBootStep.eligibility.availableTitle')
    : hasNoEligibleDevices.value
      ? t('onboarding.internalBootStep.eligibility.noDevicesTitle')
      : t('onboarding.internalBootStep.eligibility.blockedTitle')
);
const eligibilityPanelDescription = computed(() =>
  canConfigure.value
    ? t('onboarding.internalBootStep.eligibility.availableDescription')
    : hasNoEligibleDevices.value
      ? t('onboarding.internalBootStep.eligibility.noDevicesDescription')
      : t('onboarding.internalBootStep.eligibility.blockedDescription')
);

const loadStatusMessage = computed(() => {
  if (contextError.value) {
    return t('onboarding.internalBootStep.status.apiError');
  }
  return '';
});

const deviceSizeById = computed(() => {
  const entries = new Map<string, number>();
  for (const option of deviceOptions.value) {
    if (option.sizeMiB !== null) {
      entries.set(option.value, option.sizeMiB);
    }
  }
  return entries;
});

const selectedSlotDevices = computed(() =>
  selectedDevices.value.slice(0, slotCount.value).filter((value) => value.length > 0)
);

const smallestSelectedDeviceMiB = computed(() => {
  let minValue: number | null = null;
  for (const device of selectedSlotDevices.value) {
    const size = deviceSizeById.value.get(device);
    if (!size || size <= 0) {
      continue;
    }
    minValue = minValue === null ? size : Math.min(minValue, size);
  }
  return minValue;
});

const maxBootSizeMiB = computed(() => {
  if (smallestSelectedDeviceMiB.value === null) {
    return null;
  }
  return Math.floor(smallestSelectedDeviceMiB.value / 2);
});

const maxCustomBootSizeGb = computed(() => {
  if (maxBootSizeMiB.value === null) {
    return null;
  }
  return Math.max(1, Math.floor(maxBootSizeMiB.value / 1024));
});

const visiblePresetOptions = computed(() => {
  const presets = templateData.value?.bootSizePresetsMiB ?? [];
  const maxSizeMiB = maxBootSizeMiB.value;
  const filtered = presets.filter((value) => {
    if (value === 0) {
      return true;
    }
    if (maxSizeMiB === null) {
      return true;
    }
    return value <= maxSizeMiB;
  });

  return filtered.map((value) => ({
    value: String(value),
    label:
      value === 0
        ? t('onboarding.internalBootStep.bootSize.wholeDrive')
        : t('onboarding.internalBootStep.bootSize.gbLabel', { size: Math.round(value / 1024) }),
  }));
});

const slotCountItems = computed<SelectMenuItem[]>(() =>
  slotOptions.value.map((option) => ({
    value: option,
    label: String(option),
  }))
);

const bootSizePresetItems = computed<SelectMenuItem[]>(() => [
  ...visiblePresetOptions.value.map((option) => ({
    value: option.value,
    label: option.label,
  })),
  {
    value: 'custom',
    label: t('onboarding.internalBootStep.bootSize.custom'),
  },
]);

const bootSizeMiB = computed(() => {
  if (bootSizePreset.value === 'custom') {
    const sizeGb = Number.parseInt(customBootSizeGb.value, 10);
    if (!Number.isFinite(sizeGb)) {
      return null;
    }
    return sizeGb * 1024;
  }

  const presetValue = Number.parseInt(bootSizePreset.value, 10);
  if (!Number.isFinite(presetValue)) {
    return null;
  }
  return presetValue;
});

const bootSizeHelpText = computed(() => {
  if (maxCustomBootSizeGb.value === null) {
    return t('onboarding.internalBootStep.bootSize.helpMinOnly');
  }
  return t('onboarding.internalBootStep.bootSize.helpRange', { max: maxCustomBootSizeGb.value });
});

const normalizeSelectedDevices = (count: number) => {
  const nextDevices = selectedDevices.value.slice(0, count);
  while (nextDevices.length < count) {
    nextDevices.push('');
  }
  selectedDevices.value = nextDevices;
};

const applyBootSizeSelection = (valueMiB: number) => {
  const presetMatch = visiblePresetOptions.value.find(
    (option) => Number.parseInt(option.value, 10) === valueMiB
  );
  if (presetMatch) {
    bootSizePreset.value = presetMatch.value;
    customBootSizeGb.value = '';
    return;
  }

  bootSizePreset.value = 'custom';
  const sizeGb = Math.max(4, Math.round(valueMiB / 1024));
  customBootSizeGb.value = String(sizeGb);
};

watch(
  slotCount,
  (value) => {
    normalizeSelectedDevices(value);
  },
  { immediate: true }
);

watch(
  [visiblePresetOptions, maxCustomBootSizeGb],
  () => {
    if (bootSizePreset.value !== 'custom') {
      const exists = visiblePresetOptions.value.some((option) => option.value === bootSizePreset.value);
      if (!exists) {
        const firstVisible = visiblePresetOptions.value[0];
        if (firstVisible) {
          bootSizePreset.value = firstVisible.value;
        } else {
          bootSizePreset.value = 'custom';
        }
      }
    }

    if (bootSizePreset.value === 'custom') {
      const parsed = Number.parseInt(customBootSizeGb.value, 10);
      if (!Number.isFinite(parsed)) {
        return;
      }
      if (parsed < 4) {
        customBootSizeGb.value = '4';
      }
      if (maxCustomBootSizeGb.value !== null && parsed > maxCustomBootSizeGb.value) {
        customBootSizeGb.value = String(maxCustomBootSizeGb.value);
      }
    }
  },
  { immediate: true }
);

watch(
  [poolName, slotCount, selectedDevices, bootSizePreset, customBootSizeGb, updateBios, bootMode],
  () => {
    if (formError.value) {
      formError.value = null;
    }
  }
);

const isDeviceDisabled = (deviceId: string, index: number) => {
  return selectedDevices.value.some(
    (selected, selectedIndex) => selectedIndex !== index && selected === deviceId
  );
};

const getDeviceSelectItems = (index: number): SelectMenuItem[] =>
  deviceOptions.value.map((option) => ({
    value: option.value,
    label: option.label,
    disabled: isDeviceDisabled(option.value, index),
  }));

const setBootMode = (mode: OnboardingBootMode) => {
  if (isStepLocked.value) {
    return;
  }

  bootMode.value = mode;
};

const handleUpdateBiosChange = (value: boolean | 'indeterminate') => {
  updateBios.value = value === true;
};

const buildValidatedSelection = (): OnboardingInternalBootSelection | null => {
  const normalizedPoolName = poolName.value.trim();
  if (!normalizedPoolName) {
    formError.value = t('onboarding.internalBootStep.validation.poolRequired');
    return null;
  }

  if (reservedNames.value.has(normalizedPoolName)) {
    formError.value = t('onboarding.internalBootStep.validation.poolReserved');
    return null;
  }

  if (shareNames.value.has(normalizedPoolName)) {
    formError.value = t('onboarding.internalBootStep.validation.poolShareName');
    return null;
  }

  if (existingPoolNames.value.has(normalizedPoolName)) {
    formError.value = t('onboarding.internalBootStep.validation.poolExists');
    return null;
  }

  const poolNameHasValidChars = /^[a-z][a-z0-9~._-]*$/.test(normalizedPoolName);
  const poolNameHasValidEnding = /[a-z_-]$/.test(normalizedPoolName);
  if (!poolNameHasValidChars || !poolNameHasValidEnding) {
    formError.value = t('onboarding.internalBootStep.validation.poolFormat');
    return null;
  }

  if (slotCount.value < 1 || slotCount.value > 2) {
    formError.value = t('onboarding.internalBootStep.validation.slotCount');
    return null;
  }

  const devices = selectedDevices.value.slice(0, slotCount.value);
  if (devices.length !== slotCount.value || devices.some((device) => !device)) {
    formError.value = t('onboarding.internalBootStep.validation.devicePerSlot');
    return null;
  }

  const uniqueDevices = new Set(devices);
  if (uniqueDevices.size !== devices.length) {
    formError.value = t('onboarding.internalBootStep.validation.uniqueDevices');
    return null;
  }

  const selectedBootSizeMiB = bootSizeMiB.value;
  if (selectedBootSizeMiB === null || !Number.isFinite(selectedBootSizeMiB)) {
    formError.value = t('onboarding.internalBootStep.validation.bootSizeRequired');
    return null;
  }
  if (selectedBootSizeMiB < MIN_BOOT_SIZE_MIB) {
    formError.value = t('onboarding.internalBootStep.validation.bootSizeMin');
    return null;
  }
  if (maxBootSizeMiB.value !== null && selectedBootSizeMiB > maxBootSizeMiB.value) {
    formError.value = t('onboarding.internalBootStep.validation.bootSizeMax');
    return null;
  }

  return {
    poolName: normalizedPoolName,
    slotCount: slotCount.value,
    devices,
    bootSizeMiB: selectedBootSizeMiB,
    updateBios: updateBios.value,
  };
};

const initializeForm = (data: InternalBootTemplateData) => {
  const draftSelection = draftStore.internalBootSelection;
  const firstSlot = data.slotOptions[0] ?? 1;
  const defaultSlot = Math.max(1, Math.min(2, firstSlot));

  poolName.value = draftSelection?.poolName ?? data.poolNameDefault ?? 'cache';
  slotCount.value = draftSelection?.slotCount ?? defaultSlot;
  selectedDevices.value =
    draftSelection?.devices.slice(0, slotCount.value) ??
    Array.from({ length: slotCount.value }, () => '');
  normalizeSelectedDevices(slotCount.value);

  updateBios.value = draftSelection?.updateBios ?? data.defaultUpdateBios;
  applyBootSizeSelection(draftSelection?.bootSizeMiB ?? data.defaultBootSizeMiB);
};

watch(
  templateData,
  (data) => {
    if (!data || hasInitializedForm.value) {
      return;
    }
    initializeForm(data);
    hasInitializedForm.value = true;
  },
  { immediate: true }
);

watch(
  () => draftStore.internalBootSelection,
  (selection) => {
    if (!selection || isLoading.value) {
      return;
    }

    poolName.value = selection.poolName;
    slotCount.value = selection.slotCount;
    selectedDevices.value = [...selection.devices];
    normalizeSelectedDevices(slotCount.value);
    updateBios.value = selection.updateBios;
    applyBootSizeSelection(selection.bootSizeMiB);
  }
);

watch(
  () => draftStore.bootMode,
  (mode) => {
    bootMode.value = toBootMode(mode);
  },
  { immediate: true }
);

const handleBack = () => {
  props.onBack?.();
};

const handleSkip = () => {
  draftStore.skipInternalBoot();
  if (props.onSkip) {
    props.onSkip();
  } else {
    props.onComplete();
  }
};

const handlePrimaryAction = () => {
  if (bootMode.value === 'usb') {
    draftStore.setBootMode('usb');
    props.onComplete();
    return;
  }

  if (!canConfigure.value) {
    formError.value = null;
    return;
  }

  const selection = buildValidatedSelection();
  if (!selection) {
    return;
  }

  draftStore.setInternalBootSelection(selection);
  props.onComplete();
};

const handleRefreshContext = async () => {
  if (isRefreshingContext.value) {
    return;
  }

  isRefreshingContext.value = true;
  try {
    await refreshInternalBootContextMutation();
    await refetchContext();
  } finally {
    isRefreshingContext.value = false;
  }
};

const primaryButtonText = computed(() => t('onboarding.internalBootStep.actions.continue'));
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
    <div class="bg-elevated border-muted rounded-xl border p-6 text-left shadow-sm md:p-10">
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <CircleStackIcon class="text-primary h-8 w-8" />
            <h2 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
              {{ t('onboarding.internalBootStep.title') }}
            </h2>
          </div>
          <p class="text-muted text-lg">
            {{ t('onboarding.internalBootStep.description') }}
          </p>
        </div>
      </div>

      <div class="grid gap-3">
        <UButton
          type="button"
          class="w-full justify-start rounded-lg px-4 py-4"
          :color="bootMode === 'usb' ? 'primary' : 'neutral'"
          :variant="bootMode === 'usb' ? 'soft' : 'outline'"
          :disabled="isStepLocked"
          :aria-pressed="bootMode === 'usb'"
          @click="setBootMode('usb')"
        >
          {{ t('onboarding.internalBootStep.options.usb') }}
        </UButton>
        <UButton
          type="button"
          class="w-full justify-start rounded-lg px-4 py-4"
          :color="bootMode === 'storage' ? 'primary' : 'neutral'"
          :variant="bootMode === 'storage' ? 'soft' : 'outline'"
          :disabled="isStepLocked"
          :aria-pressed="bootMode === 'storage'"
          @click="setBootMode('storage')"
        >
          {{ t('onboarding.internalBootStep.options.storage') }}
        </UButton>
      </div>

      <UAlert
        v-if="isStorageBootSelected && hasEligibleDevices"
        data-testid="internal-boot-intro-panel"
        class="my-8"
        color="primary"
        variant="subtle"
        icon="i-lucide-info"
      >
        <template #description>
          <div class="space-y-3 text-sm leading-relaxed">
            <p>{{ t('onboarding.internalBootStep.warning.bootablePoolDescription') }}</p>
            <p>{{ t('onboarding.internalBootStep.warning.bootablePoolVolumes') }}</p>
            <ul class="list-disc space-y-1 pl-5">
              <li>{{ t('onboarding.internalBootStep.warning.systemBootVolume') }}</li>
              <li>{{ t('onboarding.internalBootStep.warning.storagePoolVolume') }}</li>
            </ul>
            <p class="font-semibold">
              {{ t('onboarding.internalBootStep.warning.storagePoolNaming') }}
            </p>
            <p>{{ t('onboarding.internalBootStep.warning.bootMirrorDescription') }}</p>
            <p class="font-semibold">
              {{ t('onboarding.internalBootStep.warning.selectedDevicesFormatted') }}
            </p>
          </div>
        </template>
      </UAlert>

      <div v-if="isStorageBootSelected && isLoading" class="mt-2">
        <OnboardingLoadingState
          compact
          :title="t('common.loading')"
          :description="t('onboarding.internalBootStep.loadingOptions')"
        />
      </div>

      <div
        v-else-if="isStorageBootSelected && contextError"
        role="alert"
        class="border-muted bg-muted/40 text-foreground rounded-lg border p-4 text-sm"
      >
        {{ loadStatusMessage }}
      </div>

      <div v-if="isStorageBootSelected && !isLoading && !contextError" class="mt-6 flex justify-end">
        <UButton
          data-testid="internal-boot-refresh-button"
          type="button"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="isBusy || isRefreshingContext"
          @click="handleRefreshContext"
        >
          <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': isRefreshingContext }" />
          {{ t('onboarding.internalBootStep.actions.refreshState', 'Refresh state') }}
        </UButton>
      </div>

      <div v-if="isStorageBootSelected && !isLoading && !contextError && canConfigure" class="space-y-5">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label class="space-y-2">
            <span class="text-muted text-sm font-medium">
              {{ t('onboarding.internalBootStep.fields.poolName') }}
            </span>
            <UInput v-model="poolName" type="text" maxlength="40" :disabled="isBusy" class="w-full" />
          </label>

          <label class="space-y-2">
            <span class="text-muted text-sm font-medium">
              {{ t('onboarding.internalBootStep.fields.slots') }}
            </span>
            <USelectMenu
              :model-value="slotCount"
              :items="slotCountItems"
              label-key="label"
              value-key="value"
              :search-input="false"
              :disabled="isBusy"
              class="w-full"
              :ui="{ content: 'z-[100]' }"
              @update:model-value="slotCount = Number($event)"
            />
          </label>
        </div>

        <div class="space-y-3">
          <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">
            {{ t('onboarding.internalBootStep.fields.devices') }}
          </h3>
          <div v-for="index in slotCount" :key="index" class="space-y-2">
            <label class="text-muted text-sm font-medium">{{
              t('onboarding.internalBootStep.fields.deviceSlot', { index })
            }}</label>
            <USelectMenu
              v-model="selectedDevices[index - 1]"
              :items="getDeviceSelectItems(index - 1)"
              label-key="label"
              value-key="value"
              :search-input="false"
              :placeholder="t('onboarding.internalBootStep.fields.selectDevice')"
              :disabled="isBusy"
              class="w-full"
              :ui="{ content: 'z-[100]' }"
            />
          </div>
        </div>

        <blockquote
          v-if="selectedDriveWarnings.length > 0"
          data-testid="internal-boot-drive-warning"
          role="alert"
          class="rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <div class="flex items-start gap-3">
            <ExclamationTriangleIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
            <div class="space-y-2 text-sm leading-relaxed text-amber-950">
              <p class="font-semibold">
                {{ t('onboarding.internalBootStep.warning.driveWarningsTitle') }}
              </p>
              <p>{{ t('onboarding.internalBootStep.warning.driveWarningsDescription') }}</p>
              <ul class="list-disc space-y-1 pl-5">
                <li v-for="option in selectedDriveWarnings" :key="option.value">
                  {{ option.label }}
                </li>
              </ul>
            </div>
          </div>
        </blockquote>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label class="space-y-2">
            <span class="text-muted text-sm font-medium">
              {{ t('onboarding.internalBootStep.fields.bootReservedSize') }}
            </span>
            <USelectMenu
              v-model="bootSizePreset"
              :items="bootSizePresetItems"
              label-key="label"
              value-key="value"
              :search-input="false"
              :disabled="isBusy"
              class="w-full"
              :ui="{ content: 'z-[100]' }"
            />
          </label>

          <label class="space-y-2">
            <span class="text-muted text-sm font-medium">
              {{ t('onboarding.internalBootStep.fields.customSizeGb') }}
            </span>
            <UInput
              v-model="customBootSizeGb"
              type="number"
              min="4"
              :max="maxCustomBootSizeGb ?? undefined"
              :disabled="isBusy || bootSizePreset !== 'custom'"
              class="w-full"
            />
          </label>
        </div>

        <p class="text-muted text-xs">{{ bootSizeHelpText }}</p>

        <label class="flex items-center gap-3 text-sm">
          <UCheckbox
            :model-value="updateBios"
            :disabled="isBusy"
            @update:model-value="handleUpdateBiosChange"
          />
          <span class="text-highlighted font-medium">{{
            t('onboarding.internalBootStep.fields.updateBios')
          }}</span>
        </label>
        <UAlert
          v-if="updateBios"
          data-testid="internal-boot-update-bios-warning"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
        >
          <template #description>
            <p class="text-sm leading-relaxed">
              {{ t('onboarding.internalBootStep.warning.updateBios') }}
            </p>
          </template>
        </UAlert>
      </div>

      <div
        v-if="isStorageBootSelected && !isLoading && shouldShowEligibilityDetails"
        data-testid="internal-boot-eligibility-panel"
        class="border-muted bg-muted/40 text-foreground mt-6 rounded-lg border text-sm"
      >
        <Accordion
          :items="[{ value: 'eligibility', title: eligibilityPanelTitle }]"
          type="single"
          collapsible
          class="border-none"
        >
          <template #trigger="{ open }">
            <div
              data-testid="internal-boot-eligibility-toggle"
              class="flex w-full items-start justify-between gap-4 p-4 text-left"
            >
              <div class="space-y-1">
                <p class="font-semibold">{{ eligibilityPanelTitle }}</p>
                <p v-if="eligibilityPanelDescription">{{ eligibilityPanelDescription }}</p>
              </div>
              <div class="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                <span>
                  {{
                    open
                      ? t('onboarding.internalBootStep.eligibility.hideDetails')
                      : t('onboarding.internalBootStep.eligibility.showDetails')
                  }}
                </span>
                <ChevronDownIcon
                  :class="[
                    open ? 'rotate-180 transform' : '',
                    'h-5 w-5 transition-transform duration-200',
                  ]"
                />
              </div>
            </div>
          </template>
          <template #content>
            <div class="border-muted space-y-4 border-t px-4 pt-4 pb-4">
              <div v-if="systemEligibilityCodes.length > 0" class="space-y-2">
                <p class="font-semibold">
                  {{ t('onboarding.internalBootStep.eligibility.systemTitle') }}
                </p>
                <ul class="list-disc space-y-2 pl-5">
                  <li v-for="code in systemEligibilityCodes" :key="code">
                    <code class="rounded bg-black/10 px-1.5 py-0.5 text-xs font-semibold">
                      {{ code }}
                    </code>
                    {{ t(SYSTEM_ELIGIBILITY_MESSAGE_KEYS[code]) }}
                  </li>
                </ul>
              </div>

              <div v-if="diskEligibilityIssues.length > 0" class="space-y-2">
                <p class="font-semibold">{{ t('onboarding.internalBootStep.eligibility.diskTitle') }}</p>
                <ul class="list-disc space-y-3 pl-5">
                  <li v-for="disk in diskEligibilityIssues" :key="disk.label">
                    <p class="font-medium">{{ disk.label }}</p>
                    <ul class="list-disc space-y-1 pl-5">
                      <li v-for="code in disk.codes" :key="`${disk.label}-${code}`">
                        <code class="rounded bg-black/10 px-1.5 py-0.5 text-xs font-semibold">
                          {{ code }}
                        </code>
                        {{ t(DISK_ISSUE_MESSAGE_KEYS[code]) }}
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </Accordion>
      </div>

      <div
        v-if="isStorageBootSelected && formError"
        class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-300"
      >
        {{ formError }}
      </div>

      <div
        class="border-muted mt-8 flex flex-col-reverse items-center justify-between gap-6 border-t pt-8 sm:flex-row"
      >
        <button
          v-if="showBack"
          @click="handleBack"
          class="text-muted hover:text-toned group flex w-full items-center justify-center gap-2 font-medium transition-colors sm:w-auto sm:justify-start"
          :disabled="isStepLocked"
        >
          <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          {{ t('common.back') }}
        </button>
        <div v-else class="hidden w-1 sm:block" />

        <div class="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
          <button
            v-if="showSkip"
            @click="handleSkip"
            class="text-muted hover:text-highlighted text-sm font-medium transition-colors sm:mr-2"
            :disabled="isBusy"
          >
            {{ t('common.skipForNow', 'Skip for now') }}
          </button>
          <BrandButton
            :text="primaryButtonText"
            class="!bg-primary hover:!bg-primary/90 w-full min-w-[160px] font-bold tracking-wide !text-white uppercase shadow-md transition-all hover:shadow-lg sm:w-auto"
            :disabled="isPrimaryActionDisabled"
            :loading="isPrimaryActionLoading"
            @click="handlePrimaryAction"
            :icon-right="ChevronRightIcon"
          />
        </div>
      </div>
    </div>
  </div>
</template>
