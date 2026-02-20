# Upgrade Onboarding System

## Overview

This system shows onboarding for fresh installs and version drift scenarios (upgrade/downgrade), using a shared modal flow. The API tracks onboarding completion state (`completed`, `completedAtVersion`) and the web client decides whether the modal should appear and which local steps to render.

## How It Works

### Backend (API)

1. **Onboarding Tracker** - `api/src/unraid-api/config/onboarding-tracker.service.ts`
   - Reads current OS version from `/etc/unraid-version` (or `PATHS_UNRAID_DATA/unraid-version`)
   - Persists onboarding state to `PATHS_CONFIG_MODULES/onboarding-tracker.json`
   - Stores:
     - `completed` (boolean)
     - `completedAtVersion` (string | undefined)

2. **GraphQL API** - `api/src/unraid-api/graph/resolvers/customization/`
   - Exposes `customization { onboarding { ... } }`
   - `onboarding` includes:
     - `status` (`INCOMPLETE`, `UPGRADE`, `DOWNGRADE`, `COMPLETED`)
     - `isPartnerBuild`, `completed`, `completedAtVersion`
     - `activationCode`
     - `onboardingState` (`registrationState`, `isRegistered`, `isFreshInstall`, `hasActivationCode`, `activationRequired`)
   - Status is computed server-side from tracker state + semver direction.

### Frontend (Web)

1. **Onboarding Store** - `web/src/components/Onboarding/store/upgradeOnboarding.ts`
   - Queries `ONBOARDING_QUERY` (`customization.onboarding`)
   - Enforces visibility guards:
     - minimum supported version (`7.3.0+`)
     - authenticated access (no unauthenticated GraphQL errors)
   - Exposes `shouldShowOnboarding` when status is `INCOMPLETE`, `UPGRADE`, or `DOWNGRADE`
   - `useUpgradeOnboardingStore` is now an alias of `useOnboardingStore`.

2. **Unified Modal** - `web/src/components/Onboarding/OnboardingModal.vue`
   - Handles both fresh-install and version-drift onboarding
   - Uses a client-side hardcoded step list (`HARDCODED_STEPS`)
   - Conditionally includes/removes `ACTIVATE_LICENSE` based on activation state
   - Resolves components from `stepRegistry`
   - Does not use server-provided per-step metadata.

## Adding New Steps

### 1. Create the Step Component

Create a new step under `web/src/components/Onboarding/steps/`, following the same prop contract used by existing steps.

Example:
```vue
<script setup lang="ts">
export interface Props {
  onComplete: () => void;
  onBack?: () => void;
  showBack?: boolean;
  onSkip?: () => void;
  showSkip?: boolean;
  isSavingStep?: boolean;
}
</script>
```

### 2. Register The Component And Step Metadata

- Add the component mapping in `web/src/components/Onboarding/stepRegistry.ts` (`stepComponents`)
- Add stepper metadata in `stepRegistry.ts` (`stepMetadata`) so the timeline has title/description/icon.

### 3. Add Step ID To The Modal And Stepper Types

- Update `StepId` unions in:
  - `web/src/components/Onboarding/OnboardingModal.vue`
  - `web/src/components/Onboarding/OnboardingSteps.vue`

### 4. Add The Step To The Client-Side Flow

- Update `HARDCODED_STEPS` in `web/src/components/Onboarding/OnboardingModal.vue`.
- Choose whether it is required via the step's `required` flag.
- If conditional, update the `availableSteps` / `filteredSteps` computed logic.

### 5. Wire Per-Step Props In `currentStepProps`

Add a `switch` case in `OnboardingModal.vue` so the step receives the right callbacks/flags (`onComplete`, `onBack`, `onSkip`, `showSkip`, etc.).

### 6. Add/Update Tests

At minimum, update:
- `web/__test__/components/Onboarding/OnboardingModal.test.ts`
- Any step-specific test file if the new step introduces custom behavior.

## Integration

`OnboardingModal.vue` is already integrated and handles both onboarding modes. No additional app wiring is usually required once the step is added to `stepRegistry` + `HARDCODED_STEPS`.

## Testing

To test upgrade/downgrade visibility:

1. Edit `PATHS_CONFIG_MODULES/onboarding-tracker.json` (default: `/boot/config/plugins/dynamix.my.servers/configs/onboarding-tracker.json`)
2. For upgrade flow, set:
   - `completed: true`
   - `completedAtVersion` to an older version than current OS version
3. For incomplete flow, set:
   - `completed: false`
   - `completedAtVersion: null` (or omit)
4. Restart the API
5. Reload web UI and verify `customization.onboarding.status` and modal visibility

For rapid local testing, the onboarding admin panel (`OnboardingAdminPanel.standalone.vue`) can also apply temporary GraphQL override state.

To test activation-step gating:

1. Ensure activation code exists (or remove it to test conditional logic)
2. Verify `registrationState` is one of `ENOKEYFILE`, `ENOKEYFILE1`, `ENOKEYFILE2` for the license step to appear
3. Restart the API
4. Reload web UI and verify whether `ACTIVATE_LICENSE` is present in the step list

## Notes

- Onboarding visibility is status-driven (`INCOMPLETE`, `UPGRADE`, `DOWNGRADE`) with client-side guards (min version + auth)
- The modal automatically switches between fresh-install and version-drift copy
- There is no server-side per-step completion tracking in this flow
- Exiting onboarding can call `completeOnboarding`; temporary bypass does not
- Version comparison uses semver for reliable ordering
- The same modal component handles all modes for consistency
- During apply in the summary step, if baseline core-settings query data is unavailable, onboarding runs in best-effort mode using trusted defaults plus draft values and still proceeds. This behavior is intentional to avoid hard-blocking onboarding when baseline reads are unavailable.
- Core-settings timezone precedence is mode-aware: for initial setup (`onboarding.completed=false`), the step prefers non-empty draft timezone, then browser timezone, then API baseline; for completed onboarding (upgrade/downgrade paths), API baseline timezone remains authoritative.
- Temporary onboarding bypass is available for support/partner workflows without marking onboarding complete (`Ctrl/Cmd + Alt + Shift + O`, `?onboarding=bypass`, `?onboarding=resume`). It is session-scoped and boot-aware.
- Bypass persistence intentionally uses `sessionStorage + boot marker` (not `localStorage`) so it can survive in-session navigation but still expire after reboot.

## Detailed Init Flow And Regression Matrix

### Purpose

This section is the reference for:

1. What happens during onboarding initialization (API startup and summary-step readiness).
2. Which regression cases are intentionally locked in tests.
3. How to map behaviors to exact test files.

### Source Of Truth Files

- Web summary behavior: `web/src/components/Onboarding/steps/OnboardingSummaryStep.vue`
- Web core settings behavior: `web/src/components/Onboarding/steps/OnboardingCoreSettingsStep.vue`
- Web installer behavior: `web/src/components/Onboarding/composables/usePluginInstaller.ts`
- API startup/init behavior: `api/src/unraid-api/graph/resolvers/customization/onboarding.service.ts`
- API activation file helpers: `api/src/unraid-api/graph/resolvers/customization/activation-steps.util.ts`

### API Init Flow (`OnboardingService.onModuleInit`)

#### High-Level Sequence

1. Read paths from store (`activationBase`, user dynamix config, ident config).
2. Resolve activation directory (`/activation` vs legacy `/activate` fallback).
3. Check first-boot completion via tracker.
4. Load and validate `.activationcode` (JSON -> DTO -> class-validator).
5. Apply customizations in order:
   - Partner banner
   - Display settings
   - Case model

Notes:
- Init no longer applies server identity by default. Server identity is applied in onboarding summary confirmation.
- `onModuleInit()` does not call external internet APIs directly. It performs local disk operations and best-effort customization materialization.

#### Call Matrix During Init

| Step | Call Type | Target | Why |
| --- | --- | --- | --- |
| Resolve activation dir | filesystem access | candidate dirs from `getActivationDirCandidates()` | Detect active activation directory. |
| Locate activation file | filesystem read dir | `*.activationcode` under activation dir | Find partner activation payload. |
| Parse and validate | JSON parse + DTO validation | `ActivationCode` model | Enforce sanitized/validated inputs before mutation. |
| Banner customization | filesystem copy/symlink | activation banner -> webgui banner path | Apply partner banner if present. |
| Display customization | cfg file write | dynamix display section | Apply branding colors/banner flags. |
| Case model customization | filesystem write/symlink | case-model asset + cfg | Set partner case model when asset exists. |

#### API Init Decision Table

| Case | Activation dir available | Tracker completed | Activation code valid | Expected behavior |
| --- | --- | --- | --- | --- |
| I1 | No | N/A | N/A | Skip setup. |
| I2 | Yes | Yes | Any | Skip customization as already completed. |
| I3 | Yes | No | No/invalid | No activation customizations applied. |
| I4 | Yes | No | Yes | Apply banner/display/case-model in sequence. |
| I5 | Yes | First init: No, second init: Yes | Yes | First init applies; subsequent init is idempotent skip. |

### Web Summary-Step Init And Apply Flow

#### Readiness/Initialization

On mount, summary step starts:

1. `GetCoreSettings` query (baseline).
2. `InstalledUnraidPlugins` query.
3. `GetAvailableLanguages` query.
4. A 10s readiness timer; if baseline is still unavailable, apply can continue in best-effort mode.

#### Apply Sequence (When User Clicks Confirm)

1. Lock modal visibility (`setIsHidden(false)`).
2. Compute baseline vs target settings.
3. Apply core settings (timezone, identity, theme).
4. Apply locale (with language install when needed).
5. Install selected plugins not already installed.
6. Apply SSH settings (optimistic verification).
7. Call completion mutation and attempt onboarding refetch.
8. Show final result dialog based on precedence.

#### Endpoint/Operation Mapping

| Purpose | Operation |
| --- | --- |
| Baseline settings | `GetCoreSettings` |
| Installed plugin names | `InstalledUnraidPlugins` |
| Language metadata | `GetAvailableLanguages` |
| Update timezone | `UpdateSystemTime` |
| Update identity | `UpdateServerIdentity` |
| Update theme | `setTheme` |
| Update locale | `SetLocale` |
| Update SSH | `UpdateSshSettings` |
| Install plugin | `InstallPlugin` (+ operation tracking query/subscription) |
| Install language pack | `InstallLanguage` (+ operation tracking query/subscription) |
| Mark onboarding complete | `CompleteOnboarding` |

### Temporary Bypass Controls

Store: `web/src/components/Onboarding/store/activationCodeModal.ts`  
Modal gate: `web/src/components/Onboarding/OnboardingModal.vue`

Bypass is intentionally separate from onboarding completion state:

1. Temporary bypass does not call `CompleteOnboarding`.
2. Normal exit behavior still follows existing completion flow.
3. Bypass applies to fresh and upgrade/downgrade onboarding.

Supported controls:

- Keyboard shortcut: `Ctrl/Cmd + Alt + Shift + O`
- URL query param: `?onboarding=bypass`
- URL query param to resume: `?onboarding=resume`

Persistence model:

- Stored per browser session (`sessionStorage`) under `onboardingTemporaryBypass`.
- Boot-aware: bypass stores a boot marker derived from server uptime, and is treated as invalid after reboot.
- URL param is consumed once and removed from the URL via `history.replaceState`.

#### Why This Persistence Model

Bypass persistence intentionally uses `sessionStorage + boot marker` rather than `sessionStorage` alone or `localStorage`.

`sessionStorage + boot marker` (chosen):

- Meets operator expectation for partner testing: bypass can survive refresh/navigation in the same browser session.
- Resets after server reboot even if browser tab/session remains open.
- Keeps scope per browser session and avoids cross-session leakage.

`sessionStorage` only (not chosen):

- Survives refresh/navigation, but does not reset on reboot if the tab remains open.
- Can leave onboarding unintentionally bypassed after reboot, which conflicts with expected re-check behavior.

`localStorage` only (not chosen):

- Persists across browser restarts and future sessions.
- Makes temporary bypass too sticky and increases risk of users forgetting onboarding is still incomplete.
- Harder to reason about during support because bypass state can linger indefinitely on a client.

Net result:

- The chosen model gives temporary convenience for active setup workflows while retaining reboot-bound safety and predictable re-entry into onboarding.

### Core Settings Timezone Precedence

Component: `web/src/components/Onboarding/steps/OnboardingCoreSettingsStep.vue`

The timezone shown/seeded in the core settings step depends on onboarding tracker completion:

1. If `coreSettingsInitialized === true`, preserve draft timezone exactly (including intentional empty).
2. If onboarding status is still loading, defer timezone override until status is known.
3. If onboarding is initial setup (`onboarding.completed === false`):
   - Use non-empty draft timezone first.
   - Else use browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) if available.
   - Else fallback to API baseline timezone.
4. If onboarding is already completed (`onboarding.completed === true`), use API baseline timezone.
5. If nothing is available, fallback chain remains trusted defaults.

### Regression Test Matrices

#### A) Summary Step: Core Setting Precedence

Test file: `web/__test__/components/Onboarding/OnboardingSummaryStep.test.ts`

| Case | Baseline available | Draft vs baseline | Expected mutation behavior |
| --- | --- | --- | --- |
| S1 | Yes | No changes | Skip all core-setting mutations. |
| S2 | Yes | One field changed | Only that field's mutation runs. |
| S3 | No | Draft populated | Apply trusted defaults + draft values (best-effort). |
| S4 | No | Draft empty | Apply trusted defaults. |
| S5 | Timed out before baseline ready | Baseline arrives later | Current behavior remains fallback path once timeout tripped. |

#### B) Summary Step: Plugin Install Matrix

Test file: `web/__test__/components/Onboarding/OnboardingSummaryStep.test.ts`

| Case | Selected plugin state | Installer result | Expected behavior |
| --- | --- | --- | --- |
| P1 | Already installed | N/A | Skip install, show already installed state. |
| P2 | Already installed (case/whitespace variants) | N/A | Skip due to normalized filename dedupe. |
| P3 | Unknown plugin id | N/A | Skip install safely. |
| P4 | Not installed | `SUCCEEDED` | Install logged as success. |
| P5 | Not installed | `FAILED` | Warning path, continue flow. |
| P6 | Not installed | timeout error | Timeout classification path. |

#### C) Summary Step: Locale/Language Matrix

Test file: `web/__test__/components/Onboarding/OnboardingSummaryStep.test.ts`

| Case | Target locale | Language metadata | Installer result | Expected behavior |
| --- | --- | --- | --- | --- |
| L1 | `en_US` | N/A | N/A | Call `setLocale` directly, no pack install. |
| L2 | non-default | present | `SUCCEEDED` | Install pack then call `setLocale`. |
| L3 | non-default | missing | N/A | Skip locale switch, warning. |
| L4 | non-default | present | `FAILED` | Keep current locale, warning. |
| L5 | non-default | present | malformed/unknown status | Keep current locale, warning. |
| L6 | non-default | present | timeout error | Timeout classification path. |

#### D) Summary Step: Completion/Result Precedence Matrix

Test file: `web/__test__/components/Onboarding/OnboardingSummaryStep.test.ts`

| Case | Completion status | Refetch status | Other flags | Expected dialog class |
| --- | --- | --- | --- | --- |
| R1 | success | success | none | Setup Applied |
| R2 | success | fail | warnings | Best-Effort |
| R3 | success | skipped (baseline unavailable) | warnings | Best-Effort |
| R4 | fail | skipped | any | Best-Effort |
| R5 | fail | skipped | timeout present | Best-Effort (completion failure wins) |
| R6 | success | success | timeout + warnings | Timeout classification wins |
| R7 | success | success | SSH verified | Fully applied path |
| R8 | success | success | SSH unverified | Best-Effort |

#### E) Summary Step: Apply Interaction Matrix

Test file: `web/__test__/components/Onboarding/OnboardingSummaryStep.test.ts`

| Case | User action | Expected behavior |
| --- | --- | --- |
| A1 | Click Apply twice while first run in progress | Second click ignored; operations not duplicated; modal lock remains active. |

#### F) Core Settings Step: Draft Ownership Matrix

Test file: `web/__test__/components/Onboarding/OnboardingCoreSettingsStep.test.ts`

| Case | `coreSettingsInitialized` | Baseline payload | Expected behavior |
| --- | --- | --- | --- |
| C1 | false | unavailable | Seed trusted defaults. |
| C2 | false | invalid name/desc | Block submit on validation. |
| C3 | false | valid data | Persist valid settings to draft. |
| C4 | true | baseline has non-empty description | Keep intentionally empty draft description. |
| C5 | true | baseline has timezone/theme/language | Keep intentionally empty initialized draft values. |
| C6 | true | baseline has valid name | Keep initialized empty name invalid (do not auto-fix from baseline). |
| C7 | false + onboarding completed=false | baseline timezone differs from browser | Prefer browser timezone over API baseline. |
| C8 | false + onboarding completed=false | non-empty draft timezone + browser + API present | Prefer draft timezone. |
| C9 | false + onboarding completed=true | browser timezone differs from API | Prefer API baseline timezone. |

#### G) API Onboarding Service: Init Matrix

Test file: `api/src/unraid-api/graph/resolvers/customization/onboarding.service.spec.ts`

| Case | Input state | Expected behavior |
| --- | --- | --- |
| B1 | init called twice, tracker complete on second call | First applies, second skips (idempotent). |
| B2 | banner copy fails + case model write fails | Continue flow; do not hard-stop chain. |
| B3 | invalid activation code payload | No customizations applied. |

#### H) Modal Bypass Matrix

Test files:
- `web/__test__/store/activationCodeModal.test.ts`
- `web/__test__/components/Onboarding/OnboardingModal.test.ts`

| Case | Input | Expected behavior |
| --- | --- | --- |
| M1 | Keyboard shortcut entered | Set temporary bypass active for current session/boot; modal hides without completion mutation. |
| M2 | `onboarding=bypass` in URL | Activate temporary bypass and remove param from URL. |
| M3 | `onboarding=resume` in URL | Clear temporary bypass, force modal visibility path, remove param from URL. |
| M4 | Temporary bypass active + upgrade onboarding pending | Modal remains hidden due bypass gate. |
| M5 | Normal close path (no bypass trigger) | Existing completion behavior remains unchanged. |

### How To Run The Targeted Suites

From repo root:

```bash
pnpm --filter @unraid/web exec vitest run __test__/components/Onboarding/OnboardingSummaryStep.test.ts
pnpm --filter @unraid/web exec vitest run __test__/components/Onboarding/OnboardingCoreSettingsStep.test.ts
pnpm --filter @unraid/api exec vitest run src/unraid-api/graph/resolvers/customization/onboarding.service.spec.ts
```
