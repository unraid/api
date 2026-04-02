import { describe, expect, it } from 'vitest';

import {
  cloneOnboardingWizardDraft,
  normalizeOnboardingWizardDraft,
} from '~/components/Onboarding/onboardingWizardState';

describe('normalizeOnboardingWizardDraft', () => {
  it('returns a safe empty draft for non-object values', () => {
    expect(normalizeOnboardingWizardDraft(null)).toEqual({});
    expect(normalizeOnboardingWizardDraft('bad input')).toEqual({});
  });

  it('normalizes valid fields and drops malformed nested values', () => {
    expect(
      normalizeOnboardingWizardDraft({
        coreSettings: {
          serverName: 'Tower',
          useSsh: 'yes',
        },
        plugins: {
          selectedIds: ['community.applications', 42],
        },
        internalBoot: {
          bootMode: 'storage',
          skipped: false,
          selection: {
            poolName: 'cache',
            slotCount: '2',
            devices: [
              { id: 'DISK-A', sizeBytes: 500 * 1024 * 1024 * 1024, deviceName: 'sda' },
              { id: '', sizeBytes: 0, deviceName: '' },
            ],
            bootSizeMiB: 16384,
            updateBios: true,
            poolMode: 'hybrid',
          },
        },
      })
    ).toEqual({
      coreSettings: {
        serverName: 'Tower',
        serverDescription: undefined,
        timeZone: undefined,
        theme: undefined,
        language: undefined,
        useSsh: undefined,
      },
      plugins: {
        selectedIds: ['community.applications'],
      },
      internalBoot: {
        bootMode: 'storage',
        skipped: false,
        selection: {
          poolName: 'cache',
          slotCount: 2,
          devices: [{ id: 'DISK-A', sizeBytes: 500 * 1024 * 1024 * 1024, deviceName: 'sda' }],
          bootSizeMiB: 16384,
          updateBios: true,
          poolMode: 'hybrid',
        },
      },
    });
  });

  it('preserves omitted optional arrays and malformed selection input as undefined', () => {
    expect(
      normalizeOnboardingWizardDraft({
        plugins: {},
        internalBoot: {
          bootMode: 'storage',
          selection: 'bad-selection',
        },
      })
    ).toEqual({
      coreSettings: undefined,
      plugins: {
        selectedIds: undefined,
      },
      internalBoot: {
        bootMode: 'storage',
        skipped: undefined,
        selection: undefined,
      },
    });
  });
});

describe('cloneOnboardingWizardDraft', () => {
  it('preserves undefined optional arrays instead of manufacturing empty ones', () => {
    expect(
      cloneOnboardingWizardDraft({
        plugins: {
          selectedIds: undefined,
        },
        internalBoot: {
          bootMode: 'storage',
          selection: {
            devices: undefined,
          },
        },
      })
    ).toEqual({
      coreSettings: undefined,
      plugins: {
        selectedIds: undefined,
      },
      internalBoot: {
        bootMode: 'storage',
        skipped: undefined,
        selection: {
          poolName: undefined,
          slotCount: undefined,
          devices: undefined,
          bootSizeMiB: undefined,
          updateBios: undefined,
          poolMode: undefined,
        },
      },
    });
  });
});
