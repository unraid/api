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
        activationStepIncluded: true,
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
      activationStepIncluded: true,
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
        activationStepIncluded: true,
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
      activationStepIncluded: true,
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

  it('only keeps valid integer slot counts and allows zero boot size', () => {
    expect(
      normalizeOnboardingWizardDraft({
        internalBoot: {
          selection: {
            slotCount: 1.5,
            bootSizeMiB: 0,
          },
        },
      })
    ).toEqual({
      coreSettings: undefined,
      plugins: undefined,
      internalBoot: {
        bootMode: undefined,
        skipped: undefined,
        selection: {
          poolName: undefined,
          slotCount: undefined,
          devices: undefined,
          bootSizeMiB: 0,
          updateBios: undefined,
          poolMode: undefined,
        },
      },
    });

    expect(
      normalizeOnboardingWizardDraft({
        internalBoot: {
          selection: {
            slotCount: '2',
            bootSizeMiB: -1,
          },
        },
      })
    ).toEqual({
      coreSettings: undefined,
      plugins: undefined,
      internalBoot: {
        bootMode: undefined,
        skipped: undefined,
        selection: {
          poolName: undefined,
          slotCount: 2,
          devices: undefined,
          bootSizeMiB: undefined,
          updateBios: undefined,
          poolMode: undefined,
        },
      },
    });
  });
});
