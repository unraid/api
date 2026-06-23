import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ref } from 'vue';

import { useOsUpdateStatus } from '~/composables/useOsUpdateStatus';

const { serverRefs, updateOsRefs, updateOsActionsRefs } = vi.hoisted(() => ({
  serverRefs: {
    regUpdatesExpired: null as Ref<boolean> | null,
    stateDataError: null as Ref<{ message: string } | undefined> | null,
    rebootType: null as Ref<string> | null,
    rebootVersion: null as Ref<string | undefined> | null,
  },
  updateOsRefs: {
    available: null as Ref<string | undefined> | null,
    availableWithRenewal: null as Ref<string | undefined> | null,
    availableRequiresAuth: null as Ref<boolean> | null,
  },
  updateOsActionsRefs: {
    rebootTypeText: null as Ref<string> | null,
  },
}));

vi.mock('~/store/server', async () => {
  const { ref } = await import('vue');
  const { defineStore } = await import('pinia');
  serverRefs.regUpdatesExpired = ref(false);
  serverRefs.stateDataError = ref(undefined);
  serverRefs.rebootType = ref('');
  serverRefs.rebootVersion = ref(undefined);
  const useServerStore = defineStore('serverMockForOsUpdateStatus', () => ({
    regUpdatesExpired: serverRefs.regUpdatesExpired!,
    stateDataError: serverRefs.stateDataError!,
    rebootType: serverRefs.rebootType!,
    rebootVersion: serverRefs.rebootVersion!,
  }));
  return { useServerStore };
});

vi.mock('~/store/updateOs', async () => {
  const { ref } = await import('vue');
  const { defineStore } = await import('pinia');
  updateOsRefs.available = ref(undefined);
  updateOsRefs.availableWithRenewal = ref(undefined);
  updateOsRefs.availableRequiresAuth = ref(false);
  const useUpdateOsStore = defineStore('updateOsMockForOsUpdateStatus', () => ({
    available: updateOsRefs.available!,
    availableWithRenewal: updateOsRefs.availableWithRenewal!,
    availableRequiresAuth: updateOsRefs.availableRequiresAuth!,
  }));
  return { useUpdateOsStore };
});

vi.mock('~/store/updateOsActions', async () => {
  const { ref } = await import('vue');
  const { defineStore } = await import('pinia');
  updateOsActionsRefs.rebootTypeText = ref('');
  const useUpdateOsActionsStore = defineStore('updateOsActionsMockForOsUpdateStatus', () => ({
    rebootTypeText: updateOsActionsRefs.rebootTypeText!,
  }));
  return { useUpdateOsActionsStore };
});

describe('useOsUpdateStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    serverRefs.regUpdatesExpired!.value = false;
    serverRefs.stateDataError!.value = undefined;
    serverRefs.rebootType!.value = '';
    serverRefs.rebootVersion!.value = undefined;
    updateOsRefs.available!.value = undefined;
    updateOsRefs.availableWithRenewal!.value = undefined;
    updateOsRefs.availableRequiresAuth!.value = false;
    updateOsActionsRefs.rebootTypeText!.value = '';
  });

  it('keeps key-state errors separate from update eligibility', () => {
    serverRefs.stateDataError!.value = { message: 'Registration key mismatch' };

    const status = useOsUpdateStatus();

    // A key error is informational and must not imply the entitlement expired.
    expect(status.blockedByKeyState.value).toBe(true);
    expect(status.entitlementExpired.value).toBe(false);
  });

  it('flags entitlement expiration independently of key state', () => {
    serverRefs.regUpdatesExpired!.value = true;

    const status = useOsUpdateStatus();

    expect(status.entitlementExpired.value).toBe(true);
    expect(status.blockedByKeyState.value).toBe(false);
  });

  it('treats update and downgrade reboots as a required reboot', () => {
    const status = useOsUpdateStatus();

    serverRefs.rebootType!.value = 'update';
    expect(status.rebootRequired.value).toBe(true);

    serverRefs.rebootType!.value = 'downgrade';
    expect(status.rebootRequired.value).toBe(true);

    serverRefs.rebootType!.value = 'thirdPartyDriversDownloading';
    expect(status.rebootRequired.value).toBe(false);

    serverRefs.rebootType!.value = '';
    expect(status.rebootRequired.value).toBe(false);
  });

  it('reports an available update from either a direct or renewal release', () => {
    const status = useOsUpdateStatus();

    expect(status.updateAvailable.value).toBe(false);

    updateOsRefs.available!.value = '7.3.1';
    expect(status.updateAvailable.value).toBe(true);

    updateOsRefs.available!.value = undefined;
    updateOsRefs.availableWithRenewal!.value = '7.3.1';
    expect(status.updateAvailable.value).toBe(true);
  });
});
