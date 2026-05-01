import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import type { BootConfigurationSummaryLabels } from '~/components/Onboarding/components/bootConfigurationSummary/buildBootConfigurationSummaryViewModel';

import { buildBootConfigurationSummaryViewModel } from '~/components/Onboarding/components/bootConfigurationSummary/buildBootConfigurationSummaryViewModel';
import OnboardingBootConfigurationSummary from '~/components/Onboarding/components/bootConfigurationSummary/OnboardingBootConfigurationSummary.vue';

const labels: BootConfigurationSummaryLabels = {
  title: 'Boot Configuration',
  bootMethod: 'Boot Method',
  bootMethodStorage: 'Storage Drive(s)',
  bootMethodUsb: 'USB/Flash Drive',
  poolMode: 'Pool mode',
  poolModeDedicated: 'Dedicated boot pool',
  poolModeHybrid: 'Boot + data pool',
  pool: 'Pool',
  slots: 'Boot devices',
  bootReserved: 'Boot Reserved',
  updateBios: 'Update BIOS',
  devices: 'Devices',
  yes: 'Yes',
  no: 'No',
};

const createBootDevice = (id: string, sizeBytes: number, deviceName: string) => ({
  id,
  sizeBytes,
  deviceName,
});

describe('OnboardingBootConfigurationSummary', () => {
  it('builds a hidden result when boot configuration was skipped', () => {
    expect(
      buildBootConfigurationSummaryViewModel(
        {
          bootMode: 'usb',
          skipped: true,
          selection: null,
        },
        {
          labels,
          formatBootSize: (bootSizeMiB) => `${bootSizeMiB} MiB`,
          formatDeviceSize: (sizeBytes) => `${Math.round(sizeBytes / 1_000_000_000)} GB`,
        }
      )
    ).toEqual({ kind: 'hidden' });
  });

  it('builds a usb summary without storage rows', () => {
    const result = buildBootConfigurationSummaryViewModel(
      {
        bootMode: 'usb',
        skipped: false,
        selection: null,
      },
      {
        labels,
        formatBootSize: (bootSizeMiB) => `${bootSizeMiB} MiB`,
        formatDeviceSize: (sizeBytes) => `${Math.round(sizeBytes / 1_000_000_000)} GB`,
      }
    );

    expect(result).toEqual({
      kind: 'ready',
      summary: {
        title: 'Boot Configuration',
        rows: [
          {
            key: 'bootMethod',
            label: 'Boot Method',
            value: 'USB/Flash Drive',
          },
        ],
        devicesLabel: 'Devices',
        devices: [],
      },
    });
  });

  it('builds a hybrid storage summary and falls back to raw device ids when labels are missing', () => {
    const result = buildBootConfigurationSummaryViewModel(
      {
        bootMode: 'storage',
        skipped: false,
        selection: {
          poolName: 'cache',
          slotCount: 2,
          devices: [
            createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda'),
            createBootDevice('DISK-B', 250 * 1024 * 1024 * 1024, 'sdb'),
          ],
          bootSizeMiB: 16384,
          updateBios: true,
          poolMode: 'hybrid',
        },
      },
      {
        labels,
        formatBootSize: (bootSizeMiB) => `${bootSizeMiB / 1024} GB`,
        formatDeviceSize: (sizeBytes) => `${Math.round(sizeBytes / 1_000_000_000)} GB`,
      }
    );

    expect(result).toEqual({
      kind: 'ready',
      summary: {
        title: 'Boot Configuration',
        rows: [
          {
            key: 'bootMethod',
            label: 'Boot Method',
            value: 'Storage Drive(s)',
          },
          {
            key: 'poolMode',
            label: 'Pool mode',
            value: 'Boot + data pool',
          },
          {
            key: 'pool',
            label: 'Pool',
            value: 'cache',
          },
          {
            key: 'slots',
            label: 'Boot devices',
            value: '2',
          },
          {
            key: 'bootReserved',
            label: 'Boot Reserved',
            value: '16 GB',
          },
          {
            key: 'updateBios',
            label: 'Update BIOS',
            value: 'Yes',
          },
        ],
        devicesLabel: 'Devices',
        devices: [
          { id: 'DISK-A', label: 'DISK-A - 537 GB (sda)' },
          { id: 'DISK-B', label: 'DISK-B - 268 GB (sdb)' },
        ],
      },
    });
  });

  it('returns an invalid result for incomplete storage selections', () => {
    expect(
      buildBootConfigurationSummaryViewModel(
        {
          bootMode: 'storage',
          skipped: false,
          selection: {
            poolName: '',
            slotCount: 1,
            devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
            bootSizeMiB: 16384,
            updateBios: true,
            poolMode: 'hybrid',
          },
        },
        {
          labels,
          formatBootSize: (bootSizeMiB) => `${bootSizeMiB} MiB`,
          formatDeviceSize: (sizeBytes) => `${Math.round(sizeBytes / 1_000_000_000)} GB`,
          missingStorageSelectionBehavior: 'invalid',
        }
      )
    ).toEqual({
      kind: 'invalid',
      reason: 'INCOMPLETE_STORAGE_SELECTION',
    });
  });

  it('renders the shared boot summary card', () => {
    const wrapper = mount(OnboardingBootConfigurationSummary, {
      props: {
        summary: {
          title: 'Boot Configuration',
          rows: [
            { key: 'bootMethod', label: 'Boot Method', value: 'Storage Drive(s)' },
            { key: 'slots', label: 'Boot devices', value: '2' },
          ],
          devicesLabel: 'Devices',
          devices: [{ id: 'DISK-A', label: 'DISK-A - 537 GB (sda)' }],
        },
      },
    });

    expect(wrapper.find('[data-testid="boot-configuration-summary"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Boot Configuration');
    expect(wrapper.text()).toContain('Storage Drive(s)');
    expect(wrapper.text()).toContain('DISK-A - 537 GB (sda)');
  });
});
