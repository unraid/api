import type {
  OnboardingBootMode,
  OnboardingInternalBootDevice,
  OnboardingInternalBootDraft,
  OnboardingPoolMode,
} from '@/components/Onboarding/onboardingWizardState';

export interface BootConfigurationSummaryLabels {
  title: string;
  bootMethod: string;
  bootMethodStorage: string;
  bootMethodUsb: string;
  poolMode: string;
  poolModeDedicated: string;
  poolModeHybrid: string;
  pool: string;
  slots: string;
  bootReserved: string;
  updateBios: string;
  devices: string;
  yes: string;
  no: string;
}

export interface BootConfigurationSummaryRow {
  key: 'bootMethod' | 'poolMode' | 'pool' | 'slots' | 'bootReserved' | 'updateBios';
  label: string;
  value: string;
}

export interface BootConfigurationSummaryDevice {
  id: string;
  label: string;
}

export interface BootConfigurationSummaryViewModel {
  title: string;
  rows: BootConfigurationSummaryRow[];
  devicesLabel: string;
  devices: BootConfigurationSummaryDevice[];
}

export type BootConfigurationSummaryBuildResult =
  | { kind: 'hidden' }
  | {
      kind: 'invalid';
      reason:
        | 'UNSUPPORTED_BOOT_MODE'
        | 'UNEXPECTED_USB_SELECTION'
        | 'MISSING_STORAGE_SELECTION'
        | 'INCOMPLETE_STORAGE_SELECTION';
    }
  | {
      kind: 'ready';
      summary: BootConfigurationSummaryViewModel;
    };

interface BuildBootConfigurationSummaryViewModelOptions {
  labels: BootConfigurationSummaryLabels;
  formatBootSize: (bootSizeMiB: number) => string;
  formatDeviceSize: (sizeBytes: number) => string;
  missingStorageSelectionBehavior?: 'hidden' | 'invalid';
}

const isKnownBootMode = (value: unknown): value is OnboardingBootMode =>
  value === 'usb' || value === 'storage';

const isKnownPoolMode = (value: unknown): value is OnboardingPoolMode =>
  value === 'dedicated' || value === 'hybrid';

const hasNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const hasPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const hasFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isValidBootDevice = (value: unknown): value is OnboardingInternalBootDevice => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    hasNonEmptyString(candidate.id) &&
    hasFiniteNumber(candidate.sizeBytes) &&
    candidate.sizeBytes > 0 &&
    hasNonEmptyString(candidate.deviceName)
  );
};

const normalizeDeviceName = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith('/dev/')) {
    return trimmed.slice('/dev/'.length);
  }
  return trimmed;
};

export const formatBootDeviceLabel = (
  device: OnboardingInternalBootDevice,
  formatDeviceSize: (sizeBytes: number) => string
) => {
  const normalizedDeviceName = normalizeDeviceName(device.deviceName);
  const sizeLabel = formatDeviceSize(device.sizeBytes);
  return normalizedDeviceName === device.id
    ? `${device.id} - ${sizeLabel}`
    : `${device.id} - ${sizeLabel} (${normalizedDeviceName})`;
};

export const buildBootConfigurationSummaryViewModel = (
  draft: OnboardingInternalBootDraft | null | undefined,
  options: BuildBootConfigurationSummaryViewModelOptions
): BootConfigurationSummaryBuildResult => {
  if (!draft || draft.skipped) {
    return { kind: 'hidden' };
  }

  const selection = draft.selection ?? null;
  const bootMode = draft.bootMode ?? (selection ? 'storage' : undefined);
  if (!isKnownBootMode(bootMode)) {
    return { kind: 'hidden' };
  }

  if (bootMode === 'usb') {
    if (selection) {
      return { kind: 'invalid', reason: 'UNEXPECTED_USB_SELECTION' };
    }

    return {
      kind: 'ready',
      summary: {
        title: options.labels.title,
        rows: [
          {
            key: 'bootMethod',
            label: options.labels.bootMethod,
            value: options.labels.bootMethodUsb,
          },
        ],
        devicesLabel: options.labels.devices,
        devices: [],
      },
    };
  }

  if (!selection) {
    return options.missingStorageSelectionBehavior === 'invalid'
      ? { kind: 'invalid', reason: 'MISSING_STORAGE_SELECTION' }
      : { kind: 'hidden' };
  }

  const devices = Array.isArray(selection.devices)
    ? selection.devices.filter((device): device is OnboardingInternalBootDevice =>
        isValidBootDevice(device)
      )
    : [];
  const poolMode = selection.poolMode;

  if (
    !isKnownPoolMode(poolMode) ||
    !hasPositiveInteger(selection.slotCount) ||
    devices.length === 0 ||
    !hasFiniteNumber(selection.bootSizeMiB) ||
    typeof selection.updateBios !== 'boolean' ||
    (poolMode === 'hybrid' && !hasNonEmptyString(selection.poolName))
  ) {
    return { kind: 'invalid', reason: 'INCOMPLETE_STORAGE_SELECTION' };
  }

  const rows: BootConfigurationSummaryRow[] = [
    {
      key: 'bootMethod',
      label: options.labels.bootMethod,
      value: options.labels.bootMethodStorage,
    },
    {
      key: 'poolMode',
      label: options.labels.poolMode,
      value: poolMode === 'dedicated' ? options.labels.poolModeDedicated : options.labels.poolModeHybrid,
    },
    {
      key: 'slots',
      label: options.labels.slots,
      value: String(selection.slotCount),
    },
    {
      key: 'updateBios',
      label: options.labels.updateBios,
      value: selection.updateBios ? options.labels.yes : options.labels.no,
    },
  ];

  if (poolMode !== 'dedicated') {
    const poolName = selection.poolName?.trim() ?? '';
    rows.splice(2, 0, {
      key: 'pool',
      label: options.labels.pool,
      value: poolName,
    });
    rows.splice(4, 0, {
      key: 'bootReserved',
      label: options.labels.bootReserved,
      value: options.formatBootSize(selection.bootSizeMiB),
    });
  }

  return {
    kind: 'ready',
    summary: {
      title: options.labels.title,
      rows,
      devicesLabel: options.labels.devices,
      devices: devices.map((device) => ({
        id: device.id,
        label: formatBootDeviceLabel(device, options.formatDeviceSize),
      })),
    },
  };
};
