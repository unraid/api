<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@vue/apollo-composable';

import { ChevronLeftIcon, CircleStackIcon } from '@heroicons/vue/24/outline';
import { ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { GET_INTERNAL_BOOT_CONTEXT_QUERY } from '@/components/Onboarding/graphql/getInternalBootContext.query';
import { useOnboardingDraftStore } from '@/components/Onboarding/store/onboardingDraft';

import type {
  OnboardingBootMode,
  OnboardingInternalBootSelection,
} from '@/components/Onboarding/store/onboardingDraft';

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

interface InternalBootDeviceOption {
  value: string;
  label: string;
  sizeMiB: number | null;
}

interface InternalBootTemplateData {
  isBootPoolEligible: boolean;
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

interface InternalBootContext {
  array: {
    state?: string | null;
    boot?: { device?: string | null } | null;
    parities: { device?: string | null }[];
    disks: { device?: string | null }[];
    caches: { name?: string | null; device?: string | null }[];
  };
  vars?: {
    fsState?: string | null;
    bootEligible?: boolean | null;
    enableBootTransfer?: string | null;
    reservedNames?: string | null;
  } | null;
  shares: { name?: string | null }[];
  disks: {
    device: string;
    size: number;
    emhttpDeviceId?: string | null;
    emhttpSectors?: number | null;
    emhttpSectorSize?: number | null;
  }[];
}

const DEFAULT_BOOT_SIZE_MIB = 16384;
const BOOT_SIZE_PRESETS_MIB = [16384, 32768, 65536, 131072];

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return 'Unknown';
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

const {
  result: contextResult,
  loading: contextLoading,
  error: contextError,
} = useQuery(GET_INTERNAL_BOOT_CONTEXT_QUERY, null, {
  fetchPolicy: 'cache-first',
});

const formError = ref<string | null>(null);
const hasInitializedForm = ref(false);
const bootMode = ref<OnboardingBootMode>(
  draftStore.bootMode === 'storage' || Boolean(draftStore.internalBootSelection) ? 'storage' : 'usb'
);

const poolName = ref('cache');
const slotCount = ref(1);
const selectedDevices = ref<string[]>(['']);
const bootSizePreset = ref<string>('');
const customBootSizeGb = ref('');
const updateBios = ref(true);

const templateData = computed<InternalBootTemplateData | null>(() => {
  const data = contextResult.value as InternalBootContext | null;
  if (!data) {
    return null;
  }

  const assignedDevices = new Set<string>();
  const assignedDiskGroups = [
    data.array.boot ? [data.array.boot] : [],
    data.array.parities,
    data.array.disks,
    data.array.caches,
  ];

  for (const group of assignedDiskGroups) {
    for (const disk of group) {
      const device = normalizeDeviceName(disk.device);
      if (device) {
        assignedDevices.add(device);
      }
    }
  }

  const deviceOptions = data.disks
    .filter((disk) => {
      const device = normalizeDeviceName(disk.device);
      if (!device) {
        return false;
      }
      if (assignedDevices.has(device)) {
        return false;
      }
      return true;
    })
    .map<InternalBootDeviceOption>((disk) => {
      const device = normalizeDeviceName(disk.device);
      const emhttpDeviceId = disk.emhttpDeviceId?.trim() || '';
      const optionValue = emhttpDeviceId || device;
      const sizeBytes = deriveDeviceSizeBytes(disk.emhttpSectors, disk.emhttpSectorSize, disk.size);
      const sizeMiB = toSizeMiB(sizeBytes);
      const sizeLabel = formatBytes(sizeBytes);
      return {
        value: optionValue,
        label: `${optionValue} - ${sizeLabel} (${device})`,
        sizeMiB,
      };
    });

  const poolNameSet = new Set<string>();
  for (const cacheDisk of data.array.caches) {
    const poolName = cacheDisk.name?.trim() || '';
    if (poolName) {
      poolNameSet.add(poolName);
    }
  }

  const reservedNameSet = new Set<string>();
  for (const reservedName of (data.vars?.reservedNames ?? '').split(',')) {
    const name = reservedName.trim();
    if (name) {
      reservedNameSet.add(name);
    }
  }

  const shareNameSet = new Set<string>();
  for (const share of data.shares) {
    const name = share.name?.trim() || '';
    if (name) {
      shareNameSet.add(name);
    }
  }

  return {
    isBootPoolEligible: Boolean(data.vars?.bootEligible),
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

const isLoading = computed(() => Boolean(contextLoading.value));
const isBusy = computed(() => Boolean(props.isSavingStep) || isLoading.value);
const isArrayStopped = computed(() => {
  if (contextResult.value?.array.state) {
    return contextResult.value.array.state === 'STOPPED';
  }
  return contextResult.value?.vars?.fsState === 'Stopped';
});
const isAlreadyOnInternalBoot = computed(() => {
  const setting = contextResult.value?.vars?.enableBootTransfer?.trim().toLowerCase();
  return setting === 'no';
});
const isBootPoolEligible = computed(() => Boolean(templateData.value?.isBootPoolEligible));
const deviceOptions = computed(() => templateData.value?.deviceOptions ?? []);
const slotOptions = computed(() => templateData.value?.slotOptions ?? [1, 2]);
const reservedNames = computed(() => new Set(templateData.value?.reservedNames ?? []));
const shareNames = computed(() => new Set(templateData.value?.shareNames ?? []));
const existingPoolNames = computed(() => new Set(templateData.value?.poolNames ?? []));

const canConfigure = computed(
  () =>
    !isAlreadyOnInternalBoot.value &&
    isArrayStopped.value &&
    isBootPoolEligible.value &&
    deviceOptions.value.length > 0
);
const isStorageBootSelected = computed(() => bootMode.value === 'storage');

const loadStatusMessage = computed(() => {
  if (contextError.value) {
    return 'Unable to load internal boot options from API.';
  }
  if (isAlreadyOnInternalBoot.value) {
    return 'Internal boot is already configured on this server.';
  }
  if (!isArrayStopped.value) {
    return 'Internal boot setup is only available while the array is stopped.';
  }
  if (!isBootPoolEligible.value) {
    return 'This server is not currently eligible for internal boot setup.';
  }
  if (deviceOptions.value.length === 0) {
    return 'No eligible devices were detected for internal boot setup.';
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
    label: value === 0 ? 'Whole drive' : `${Math.round(value / 1024)} GB`,
  }));
});

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
    return 'Minimum is 4 GB.';
  }
  return `Minimum is 4 GB; maximum is ${maxCustomBootSizeGb.value} GB (50% of the smallest selected drive).`;
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

const buildValidatedSelection = (): OnboardingInternalBootSelection | null => {
  const normalizedPoolName = poolName.value.trim();
  if (!normalizedPoolName) {
    formError.value = 'Pool name is required.';
    return null;
  }

  if (reservedNames.value.has(normalizedPoolName)) {
    formError.value = 'Do not use reserved names.';
    return null;
  }

  if (shareNames.value.has(normalizedPoolName)) {
    formError.value = 'Do not use user share names.';
    return null;
  }

  if (existingPoolNames.value.has(normalizedPoolName)) {
    formError.value = 'Pool name already exists.';
    return null;
  }

  const poolNamePattern = /^[a-z]([a-z0-9~._-]*[a-z_-])*$/;
  if (!poolNamePattern.test(normalizedPoolName)) {
    formError.value = 'Use only lowercase with no special characters or leading/trailing digits.';
    return null;
  }

  if (slotCount.value < 1 || slotCount.value > 2) {
    formError.value = 'Select 1 or 2 slots.';
    return null;
  }

  const devices = selectedDevices.value.slice(0, slotCount.value);
  if (devices.length !== slotCount.value || devices.some((device) => !device)) {
    formError.value = 'Select a device for each slot.';
    return null;
  }

  const uniqueDevices = new Set(devices);
  if (uniqueDevices.size !== devices.length) {
    formError.value = 'Each selected device must be unique.';
    return null;
  }

  const selectedBootSizeMiB = bootSizeMiB.value;
  if (selectedBootSizeMiB === null || !Number.isFinite(selectedBootSizeMiB)) {
    formError.value = 'Select a valid boot reserved size.';
    return null;
  }
  if (selectedBootSizeMiB < 4096) {
    formError.value = 'Boot reserved size must be at least 4 GB.';
    return null;
  }
  if (maxBootSizeMiB.value !== null && selectedBootSizeMiB > maxBootSizeMiB.value) {
    formError.value = 'Boot reserved size cannot exceed 50% of the smallest selected drive.';
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

  poolName.value = draftSelection?.poolName || data.poolNameDefault || 'cache';
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
    if (mode === 'usb' || mode === 'storage') {
      bootMode.value = mode;
    }
  }
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
    draftStore.skipInternalBoot();
    props.onComplete();
    return;
  }

  if (!canConfigure.value) {
    formError.value = loadStatusMessage.value || 'Internal boot setup is not available right now.';
    return;
  }

  const selection = buildValidatedSelection();
  if (!selection) {
    return;
  }

  draftStore.setInternalBootSelection(selection);
  props.onComplete();
};

const primaryButtonText = computed(() => 'Continue');
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
    <div class="bg-elevated border-muted rounded-xl border p-6 text-left shadow-sm md:p-10">
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <CircleStackIcon class="text-primary h-8 w-8" />
            <h2 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
              Configure Boot
            </h2>
          </div>
          <p class="text-muted text-lg">
            You can setup Unraid to boot via a USB or using a boot drive. The default is to boot via a
            USB. You can always switch to use a storage drive instead of a USB in the Unraid Dashboard.
          </p>
        </div>
      </div>

      <div class="space-y-3">
        <label
          class="border-muted bg-bg/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors"
        >
          <input v-model="bootMode" type="radio" value="usb" class="mt-0.5 h-4 w-4" :disabled="isBusy" />
          <div class="space-y-1">
            <p class="text-highlighted text-sm font-semibold">Use USB to Boot Unraid</p>
          </div>
        </label>
        <label
          class="border-muted bg-bg/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors"
        >
          <input
            v-model="bootMode"
            type="radio"
            value="storage"
            class="mt-0.5 h-4 w-4"
            :disabled="isBusy"
          />
          <div class="space-y-1">
            <p class="text-highlighted text-sm font-semibold">Use Storage Drive(s) to Boot Unraid</p>
          </div>
        </label>
      </div>

      <blockquote
        v-if="isStorageBootSelected"
        class="my-8 border-s-4 border-yellow-500 bg-yellow-100 p-4"
      >
        <div class="flex items-start gap-2">
          <ExclamationTriangleIcon class="mt-0.5 h-6 w-6 flex-shrink-0 text-yellow-700" />
          <p class="text-sm leading-relaxed text-yellow-900">All selected devices will be formatted.</p>
        </div>
      </blockquote>

      <div
        v-if="isStorageBootSelected && isLoading"
        class="text-muted rounded-lg border border-dashed p-4 text-sm"
      >
        Loading internal boot options...
      </div>

      <div
        v-else-if="isStorageBootSelected && !canConfigure"
        class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900/10 dark:text-yellow-200"
      >
        {{ loadStatusMessage }}
      </div>

      <div v-else-if="isStorageBootSelected" class="space-y-5">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label class="space-y-2">
            <span class="text-muted text-sm font-medium">Pool name</span>
            <input
              v-model="poolName"
              type="text"
              maxlength="40"
              class="border-muted bg-bg focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              :disabled="isBusy"
            />
          </label>

          <label class="space-y-2">
            <span class="text-muted text-sm font-medium">Slots</span>
            <select
              v-model.number="slotCount"
              class="border-muted bg-bg focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              :disabled="isBusy"
            >
              <option v-for="option in slotOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
        </div>

        <div class="space-y-3">
          <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">Devices</h3>
          <div v-for="index in slotCount" :key="index" class="space-y-2">
            <label class="text-muted text-sm font-medium">Device {{ index }}</label>
            <select
              v-model="selectedDevices[index - 1]"
              class="border-muted bg-bg focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              :disabled="isBusy"
            >
              <option value="">Select device</option>
              <option
                v-for="option in deviceOptions"
                :key="option.value"
                :value="option.value"
                :disabled="isDeviceDisabled(option.value, index - 1)"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label class="space-y-2">
            <span class="text-muted text-sm font-medium">Boot reserved size</span>
            <select
              v-model="bootSizePreset"
              class="border-muted bg-bg focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              :disabled="isBusy"
            >
              <option v-for="option in visiblePresetOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
              <option value="custom">User defined</option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="text-muted text-sm font-medium">Custom size (GB)</span>
            <input
              v-model="customBootSizeGb"
              type="number"
              min="4"
              :max="maxCustomBootSizeGb ?? undefined"
              class="border-muted bg-bg focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              :disabled="isBusy || bootSizePreset !== 'custom'"
            />
          </label>
        </div>

        <p class="text-muted text-xs">{{ bootSizeHelpText }}</p>

        <label class="flex items-center gap-3 text-sm">
          <input v-model="updateBios" type="checkbox" class="h-4 w-4" :disabled="isBusy" />
          <span class="text-highlighted font-medium">Update BIOS boot order</span>
        </label>
        <p class="text-muted text-xs">
          Some systems may need manual intervention to change boot order in the BIOS.
        </p>
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
          :disabled="isBusy"
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
            :disabled="isBusy"
            :loading="isBusy"
            @click="handlePrimaryAction"
            :icon-right="ChevronRightIcon"
          />
        </div>
      </div>
    </div>
  </div>
</template>
