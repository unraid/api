import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

/**
 * Single source of truth for whether the server can check for / install an OS
 * update, and whether a reboot is pending to apply one.
 *
 * The two gating concepts are intentionally separated and named here so the
 * rule lives in one place instead of being re-derived (and drifting) in each
 * component:
 *
 * - `entitlementExpired` — the license's update window has lapsed. This DOES
 *   gate the plain "check for update" / "update available" affordance; the
 *   renewal/eligibility path replaces it.
 * - `blockedByKeyState` — the server has a registration/key error (e.g. an
 *   EGUID GUID mismatch). This is INFORMATIONAL ONLY and must never gate update
 *   or reboot UI: OS update eligibility is keyed off the entitlement window, not
 *   key validity, and a pending reboot applies an already-installed update.
 */
export const useOsUpdateStatus = () => {
  const serverStore = useServerStore();
  const updateOsStore = useUpdateOsStore();
  const updateOsActionsStore = useUpdateOsActionsStore();

  const { regUpdatesExpired, stateDataError, rebootType, rebootVersion } = storeToRefs(serverStore);
  const { available, availableWithRenewal, availableRequiresAuth } = storeToRefs(updateOsStore);
  const { rebootTypeText } = storeToRefs(updateOsActionsStore);

  /** License update entitlement has lapsed — gates the plain update affordance. */
  const entitlementExpired = computed(() => regUpdatesExpired.value);

  /** Registration/key error present — informational only, never gates updates. */
  const blockedByKeyState = computed(() => Boolean(stateDataError.value));

  /** A newer release exists (directly installable or via renewal). */
  const updateAvailable = computed(() => Boolean(available.value || availableWithRenewal.value));

  /** A reboot is pending to apply an already-installed update/downgrade. */
  const rebootRequired = computed(
    () => rebootType.value === 'update' || rebootType.value === 'downgrade'
  );

  return {
    entitlementExpired,
    blockedByKeyState,
    available,
    availableWithRenewal,
    updateAvailable,
    requiresAuth: availableRequiresAuth,
    rebootType,
    rebootTypeText,
    rebootVersion,
    rebootRequired,
  };
};
