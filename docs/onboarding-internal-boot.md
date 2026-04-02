# Onboarding Internal Boot

## Overview

The internal-boot step is part of the main onboarding wizard, but it still has its own operational state because it can perform real disk actions.

The step uses two layers of state:

- `draft.internalBoot`
  - user intent that should survive resume
- `internalBootState`
  - operational result flags used by Summary and Next Steps

Both are stored in `onboarding-tracker.json`, but only the draft is user-entered data.

## Visibility

Internal boot is still server-gated.

`api/src/unraid-api/graph/resolvers/customization/onboarding.service.ts` shows `CONFIGURE_BOOT` only when:

- `getters.emhttp().var.enableBootTransfer === 'yes'`

That means the step is recomputed on every bootstrap/read instead of being frozen in the tracker.

## Saved Shape

The persisted internal-boot draft lives under:

```json
{
  "draft": {
    "internalBoot": {
      "bootMode": "storage",
      "skipped": false,
      "selection": {
        "poolName": "cache",
        "slotCount": 2,
        "devices": [
          {
            "id": "disk1",
            "sizeBytes": 512110190592,
            "deviceName": "sda"
          },
          {
            "id": "disk2",
            "sizeBytes": 512110190592,
            "deviceName": "sdb"
          }
        ],
        "bootSizeMiB": 32768,
        "updateBios": true,
        "poolMode": "hybrid"
      }
    }
  },
  "internalBootState": {
    "applyAttempted": true,
    "applySucceeded": false
  }
}
```

`draft.internalBoot` means:

- `bootMode`
  - `usb` or `storage`
- `skipped`
  - whether the user explicitly skipped the step
- `selection`
  - the storage pool choice when boot moves off USB
  - selected devices are persisted as `{ id, sizeBytes, deviceName }` objects so the summary views can render stable labels without re-fetching disk metadata

`internalBootState` means:

- `applyAttempted`
- `applySucceeded`

Those flags are separate so the draft stays about user intent, not execution bookkeeping.

## Frontend Flow

Main wizard usage:

- `web/src/components/Onboarding/steps/OnboardingInternalBootStep.vue`
- `web/src/components/Onboarding/steps/OnboardingSummaryStep.vue`
- `web/src/components/Onboarding/steps/OnboardingNextStepsStep.vue`

Standalone/admin flow:

- `web/src/components/Onboarding/standalone/OnboardingInternalBoot.standalone.vue`

The step component now takes `initialDraft` and emits committed snapshots back to the modal instead of mutating a shared Pinia draft store.

## Persistence Rules

Internal-boot choices are saved only when the user leaves the step or commits a downstream step transition.

That includes:

- continuing from `CONFIGURE_BOOT`
- skipping `CONFIGURE_BOOT`
- navigating back from later steps after internal-boot changes

Summary updates `internalBootState` after apply attempts so Next Steps can render the correct follow-up actions.

## Current Behavior Notes

- The step is hidden as soon as the server no longer qualifies for internal boot transfer on the next bootstrap/read.
- The wizard intentionally keeps the current 1:1 behavior where externally changed system state can remove the step after a reopen.
- A future session-only sticky-step behavior can be added separately without changing the durable tracker model.

## Testing

Automated coverage:

- `web/__test__/components/Onboarding/OnboardingInternalBootStep.test.ts`
- `web/__test__/components/Onboarding/OnboardingInternalBootStandalone.test.ts`
- `api/src/unraid-api/config/onboarding-tracker.service.spec.ts`
- `api/src/unraid-api/graph/resolvers/customization/onboarding.service.spec.ts`

Recommended manual checks:

1. Start on a server with `enableBootTransfer=yes` and confirm `CONFIGURE_BOOT` appears.
2. Choose storage-backed boot, continue, refresh, and confirm the step resumes from server state.
3. Apply internal boot from Summary and confirm `internalBootState` drives the post-apply UI.
4. Reopen onboarding on a server that no longer qualifies and confirm the step is omitted from `visibleStepIds`.
