# Onboarding Wizard

## Overview

The onboarding wizard is now server-owned.

- Durable progress lives in `onboarding-tracker.json`.
- The API decides which step IDs are visible for the current server.
- The web app keeps only in-memory draft state while the user is editing a step.
- Nothing in onboarding uses `localStorage` for draft persistence anymore.

## Data Flow

### Bootstrap

`web/src/components/Onboarding/store/onboardingContextData.ts` loads `ONBOARDING_BOOTSTRAP_QUERY`.

That query returns:

- `customization.onboarding.status`
- `customization.onboarding.shouldOpen`
- `customization.onboarding.onboardingState`
- `customization.onboarding.wizard`

How those fields are determined:

- `status`
  - computed server-side from tracker completion state plus version direction
  - `INCOMPLETE` when `completed=false`
  - `UPGRADE` / `DOWNGRADE` when onboarding was completed on a different supported version
  - `COMPLETED` when onboarding was already completed for the current effective version line
- `shouldOpen`
  - computed server-side from `forceOpen`, current version support, completion state, and the in-memory bypass flag
  - current formula is effectively `!isBypassed && (forceOpen || (isVersionSupported && !completed))`
- `onboardingState`
  - derived from current server facts, not the tracker file
  - includes registration state, whether the server is already registered, whether this is a fresh install, whether an activation code exists, and whether activation is still required
- `wizard`
  - built from durable tracker state plus live server state
  - `visibleStepIds` are computed on read
  - `currentStepId` comes from persisted navigation state, then falls to the nearest visible step if the saved step is no longer valid
  - `draft` and `internalBootState` come from `onboarding-tracker.json`

`wizard` contains:

- `currentStepId`
- `visibleStepIds`
- `draft`
- `internalBootState`

### Server State

`api/src/unraid-api/config/onboarding-tracker.json` stores the durable wizard state:

```json
{
  "completed": false,
  "completedAtVersion": null,
  "forceOpen": false,
  "draft": {
    "coreSettings": {},
    "plugins": {},
    "internalBoot": {}
  },
  "navigation": {
    "currentStepId": "CONFIGURE_SETTINGS"
  },
  "internalBootState": {
    "applyAttempted": false,
    "applySucceeded": false
  }
}
```

The tracker shape is defined in `api/src/unraid-api/config/onboarding-tracker.model.ts`.

### Client State

`web/src/components/Onboarding/OnboardingModal.vue` owns the transient in-memory wizard state.

- It hydrates `localDraft`, `localCurrentStepId`, and `localInternalBootState` from the bootstrap query.
- Step components receive draft slices through props.
- Step components return committed values through callbacks like `onComplete`, `onBack`, and `onSkip`.

The old Pinia draft store was removed:

- `web/src/components/Onboarding/store/onboardingDraft.ts`

### Step Queries

Not every step relies only on bootstrap data.

- Bootstrap decides whether onboarding opens and hydrates the server-owned wizard draft.
- Individual steps can still run live step-specific queries after they mount.

Current step-local query behavior:

- `CONFIGURE_SETTINGS`
  - runs `GET_CORE_SETTINGS_QUERY` for live server name, description, SSH, theme, language, and server timezone
  - shows a full-step loading state while that initial live baseline is still pending and there is no draft yet
  - if that live query fails and there is no draft, the step shows a retryable warning and falls back to editable defaults
- `ADD_PLUGINS`
  - runs `INSTALLED_UNRAID_PLUGINS_QUERY`
  - shows a step-local loading state while installed plugin data is pending
- `CONFIGURE_BOOT`
  - runs `GetInternalBootContextDocument`
  - shows a loading state while the internal-boot context is pending
  - shows a step-local error state if that query fails
- `SUMMARY`
  - runs read-only baseline queries used for the final apply step
  - does not block rendering, but surfaces readiness warnings if baseline data is unavailable

Steps like `OVERVIEW`, `ACTIVATE_LICENSE`, and `NEXT_STEPS` do not wait on an extra step-local bootstrap-sized query before rendering.

### Core Settings Precedence

Core Settings uses both bootstrap draft state and a live server query. The precedence is intentional.

For server name and description:

- if `initialDraft` exists, use the draft
- otherwise use live server data from `GET_CORE_SETTINGS_QUERY`
- on fresh setup with activation metadata, prefer activation identity over the generic API identity

For timezone:

- if draft timezone exists, use draft timezone
- otherwise wait until onboarding status and the live core-settings query have both settled
- on fresh setup, prefer browser timezone if there is no draft timezone
- if browser timezone is unavailable on fresh setup, fall back to the server timezone
- on non-fresh setup, prefer the server timezone

Why onboarding status matters here:

- timezone precedence is different for fresh setup vs non-fresh setup
- fresh setup prefers browser timezone if there is no draft
- non-fresh setup prefers the server timezone

## Saving Rules

The wizard saves only on step transitions.

Current transitions that persist:

- `Continue`
- `Back`
- `Skip`

Typing inside a step stays local until one of those actions happens.

`Back` persists the draft snapshot from the step the user is leaving, then stores the previous visible step as `navigation.currentStepId`. It is not a no-op navigation button.

Persistence goes through:

- `web/src/components/Onboarding/graphql/saveOnboardingDraft.mutation.ts`
- `api/src/unraid-api/graph/resolvers/onboarding/onboarding.mutation.ts`
- `api/src/unraid-api/graph/resolvers/customization/onboarding.service.ts`

The API mutation is intentionally minimal and returns `Boolean`.

## Visible Steps

The frontend still owns presentation:

- step component registry
- step titles/descriptions/icons
- per-step UI implementation

The API owns visibility:

- `OnboardingService.getVisibleWizardStepIds()`

Current server-driven rules:

- `CONFIGURE_BOOT` appears only when internal boot transfer is available.
- `ACTIVATE_LICENSE` appears only when activation is still required.

The visible step list is computed on read and is not persisted in the tracker.

If the saved `currentStepId` is no longer visible, the API falls to the nearest valid visible step by using a fixed step order, not by doing math on a numeric index.

Example:

- saved `currentStepId = CONFIGURE_BOOT`
- current visible steps = `OVERVIEW`, `CONFIGURE_SETTINGS`, `ADD_PLUGINS`, `SUMMARY`, `NEXT_STEPS`
- `CONFIGURE_BOOT` is no longer visible
- the API walks forward in the canonical order first and returns `ADD_PLUGINS`

If there is no later visible step, it walks backward. If neither search finds a match, it falls to the first visible step.

## Failure Handling

Step-transition saves are blocking.

- Navigation does not advance until `saveOnboardingDraft` succeeds.
- The active step shows a loading state while the save is in flight.
- A failed save surfaces a retryable error in the modal.
- The user can exit with `Close onboarding`.

`Close onboarding` currently reuses the existing close flow and logs the close reason through GraphQL when it came from a save failure.

## Legacy Cleanup

The only backward-compatibility behavior left is cleanup of old browser draft keys.

`web/src/components/Onboarding/store/onboardingStorageCleanup.ts` removes:

- `onboardingDraft`
- any related legacy key containing `onboardingDraft`
- the old session-hidden modal flag

This runs best-effort and exists only to delete stale browser state. The cleanup does not migrate old values into the new server draft, and the new flow never reads onboarding progress from browser storage again.

Concretely, cleanup works by calling `window.localStorage.removeItem('onboardingDraft')`, then scanning every localStorage key and removing any key whose name contains `onboardingDraft` (for example old persisted Pinia keys). It also removes the old session-hidden modal key from `sessionStorage`.

## Adding Or Changing Steps

### Add a New Durable Draft Section

1. Update the tracker model in `api/src/unraid-api/config/onboarding-tracker.model.ts`.
2. Update GraphQL inputs/types in:
   - `api/src/unraid-api/graph/resolvers/onboarding/onboarding.model.ts`
   - `api/src/unraid-api/graph/resolvers/customization/activation-code.model.ts`
3. Normalize and persist the new fields in `OnboardingTrackerService`.
4. Map GraphQL input to tracker shape in `OnboardingService.saveOnboardingDraft()`.

### Add a New Step

1. Create or update the Vue step component under `web/src/components/Onboarding/steps`.
2. Register presentation metadata in `web/src/components/Onboarding/stepRegistry.ts`.
3. Add the step ID to the shared step types/enums on both API and web.
4. Update the server-side visibility rules in `OnboardingService`.
5. Wire the step into `OnboardingModal.vue`.

## Testing

Primary coverage lives in:

- `api/src/unraid-api/config/onboarding-tracker.service.spec.ts`
- `api/src/unraid-api/graph/resolvers/customization/onboarding.service.spec.ts`
- `api/src/unraid-api/graph/resolvers/onboarding/onboarding.mutation.spec.ts`
- `web/__test__/components/Onboarding`
- `web/__test__/store/onboardingContextData.test.ts`

Recommended manual checks:

1. Open onboarding on an incomplete server and confirm the modal hydrates from the server.
2. Move between steps and refresh after a transition to confirm resume uses the saved server step.
3. Force a save failure and confirm navigation blocks, the error is visible, and `Close onboarding` exits.
4. Verify that no `onboardingDraft` key is recreated in `localStorage`.
