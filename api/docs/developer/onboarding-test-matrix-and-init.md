# Onboarding Test Matrix And Init Flow

## Purpose

This document is the reference for:

1. What happens during onboarding initialization (API startup and summary-step readiness).
2. Which regression cases are intentionally locked in tests.
3. How to map behaviors to exact test files.

## Source Of Truth Files

- Web summary behavior: `web/src/components/Onboarding/steps/OnboardingSummaryStep.vue`
- Web core settings behavior: `web/src/components/Onboarding/steps/OnboardingCoreSettingsStep.vue`
- Web installer behavior: `web/src/components/Onboarding/composables/usePluginInstaller.ts`
- API startup/init behavior: `api/src/unraid-api/graph/resolvers/customization/onboarding.service.ts`
- API activation file helpers: `api/src/unraid-api/graph/resolvers/customization/activation-steps.util.ts`

## API Init Flow (OnboardingService.onModuleInit)

### High-Level Sequence

1. Read paths from store (`activationBase`, user dynamix config, ident config).
2. Resolve activation directory (`/activation` vs legacy `/activate` fallback).
3. Check first-boot completion via tracker.
4. Load and validate `.activationcode` (JSON -> DTO -> class-validator).
5. Apply customizations in order:
   - Partner banner
   - Display settings
   - Case model
   - Server identity

### Call Matrix During Init

| Step | Call Type | Target | Why |
| --- | --- | --- | --- |
| Resolve activation dir | filesystem access | candidate dirs from `getActivationDirCandidates()` | Detect active activation directory. |
| Locate activation file | filesystem read dir | `*.activationcode` under activation dir | Find partner activation payload. |
| Parse and validate | JSON parse + DTO validation | `ActivationCode` model | Enforce sanitized/validated inputs before mutation. |
| Banner customization | filesystem copy | activation banner -> webgui banner path | Apply partner banner if present. |
| Display customization | cfg file write | dynamix display section | Apply branding colors/banner flags. |
| Case model customization | filesystem write | case-model cfg | Set partner case model when asset exists. |
| Identity customization | local HTTP over unix socket | `emcmd` -> `POST /update` via emhttp socket | Apply `NAME`, `SYS_MODEL`, `COMMENT` through emhttp update path. |

### Important Init Notes

- `onModuleInit()` does **not** call external internet APIs.
- It does perform an HTTP request internally through unix socket via `emcmd` (`http://unix:<socket>:/update`).
- If tracker reports onboarding completed, init skips customization.
- Customization steps are best-effort and resilient: one step error should not block later steps.

### API Init Decision Table

| Case | Activation dir available | Tracker completed | Activation code valid | Expected behavior |
| --- | --- | --- | --- | --- |
| I1 | No | N/A | N/A | Skip setup. |
| I2 | Yes | Yes | Any | Skip customization as already completed. |
| I3 | Yes | No | No/invalid | No activation customizations applied. |
| I4 | Yes | No | Yes | Apply banner/display/case-model/identity in sequence. |
| I5 | Yes | First init: No, second init: Yes | Yes | First init applies; subsequent init is idempotent skip. |

## Web Summary-Step Init And Apply Flow

### Readiness/Initialization

On mount, summary step starts:

1. `GetCoreSettings` query (baseline).
2. `InstalledUnraidPlugins` query.
3. `GetAvailableLanguages` query.
4. A 10s readiness timer; if baseline is still unavailable, apply can continue in best-effort mode.

### Apply Sequence (When User Clicks Confirm)

1. Lock modal visibility (`setIsHidden(false)`).
2. Compute baseline vs target settings.
3. Apply core settings (timezone, identity, theme).
4. Apply locale (with language install when needed).
5. Install selected plugins not already installed.
6. Apply SSH settings (optimistic verification).
7. Call completion mutation and attempt onboarding refetch.
8. Show final result dialog based on precedence.

### Endpoint/Operation Mapping

| Purpose | Operation |
| --- | --- |
| Baseline settings | `GetCoreSettings` |
| Installed plugin names | `InstalledUnraidPlugins` |
| Language metadata | `GetAvailableLanguages` |
| Update timezone | `UpdateSystemTime` |
| Update identity | `UpdateServerIdentity` |
| Update theme | `SetLegacyTheme` |
| Update locale | `SetLocale` |
| Update SSH | `UpdateSshSettings` |
| Install plugin | `InstallPlugin` (+ operation tracking query/subscription) |
| Install language pack | `InstallLanguage` (+ operation tracking query/subscription) |
| Mark onboarding complete | `CompleteOnboarding` |

## Temporary Bypass Controls

Store: `web/src/components/Onboarding/store/activationCodeModal.ts`  
Modal gate: `web/src/components/Onboarding/OnboardingModal.vue`

Bypass is intentionally separate from onboarding completion state:

1. Temporary bypass does **not** call `CompleteOnboarding`.
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

### Why This Persistence Model

Bypass persistence intentionally uses `sessionStorage + boot marker` rather than `sessionStorage` alone or `localStorage`.

`sessionStorage + boot marker` (chosen):

- Meets operator expectation for partner testing: bypass can survive refresh/navigation in the same browser session.
- Resets after server reboot even if browser tab/session remains open.
- Keeps scope per browser session and avoids cross-session leakage.

`sessionStorage` only (not chosen):

- Survives refresh/navigation, but does **not** reset on reboot if the tab remains open.
- Can leave onboarding unintentionally bypassed after reboot, which conflicts with expected re-check behavior.

`localStorage` only (not chosen):

- Persists across browser restarts and future sessions.
- Makes temporary bypass too sticky and increases risk of users forgetting onboarding is still incomplete.
- Harder to reason about during support because bypass state can linger indefinitely on a client.

Net result:

- The chosen model gives temporary convenience for active setup workflows while retaining reboot-bound safety and predictable re-entry into onboarding.

## Core Settings Timezone Precedence

Component: `web/src/components/Onboarding/steps/OnboardingCoreSettingsStep.vue`

The timezone shown/seeded in the core settings step now depends on onboarding tracker completion:

1. If `coreSettingsInitialized === true`, preserve draft timezone exactly (including intentional empty).
2. If onboarding status is still loading, defer timezone override until status is known.
3. If onboarding is initial setup (`onboarding.completed === false`):
   - Use non-empty draft timezone first.
   - Else use browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) if available.
   - Else fallback to API baseline timezone.
4. If onboarding is already completed (`onboarding.completed === true`), use API baseline timezone.
5. If nothing is available, fallback chain remains trusted defaults.

## Regression Test Matrices

### A) Summary Step: Core Setting Precedence

Test file: `web/__test__/components/Onboarding/OnboardingSummaryStep.test.ts`

| Case | Baseline available | Draft vs baseline | Expected mutation behavior |
| --- | --- | --- | --- |
| S1 | Yes | No changes | Skip all core-setting mutations. |
| S2 | Yes | One field changed | Only that field's mutation runs. |
| S3 | No | Draft populated | Apply trusted defaults + draft values (best-effort). |
| S4 | No | Draft empty | Apply trusted defaults. |
| S5 | Timed out before baseline ready | Baseline arrives later | Current behavior remains fallback path once timeout tripped. |

### B) Summary Step: Plugin Install Matrix

Test file: `web/__test__/components/Onboarding/OnboardingSummaryStep.test.ts`

| Case | Selected plugin state | Installer result | Expected behavior |
| --- | --- | --- | --- |
| P1 | Already installed | N/A | Skip install, show already installed state. |
| P2 | Already installed (case/whitespace variants) | N/A | Skip due to normalized filename dedupe. |
| P3 | Unknown plugin id | N/A | Skip install safely. |
| P4 | Not installed | `SUCCEEDED` | Install logged as success. |
| P5 | Not installed | `FAILED` | Warning path, continue flow. |
| P6 | Not installed | timeout error | Timeout classification path. |

### C) Summary Step: Locale/Language Matrix

Test file: `web/__test__/components/Onboarding/OnboardingSummaryStep.test.ts`

| Case | Target locale | Language metadata | Installer result | Expected behavior |
| --- | --- | --- | --- | --- |
| L1 | `en_US` | N/A | N/A | Call `setLocale` directly, no pack install. |
| L2 | non-default | present | `SUCCEEDED` | Install pack then call `setLocale`. |
| L3 | non-default | missing | N/A | Skip locale switch, warning. |
| L4 | non-default | present | `FAILED` | Keep current locale, warning. |
| L5 | non-default | present | malformed/unknown status | Keep current locale, warning. |
| L6 | non-default | present | timeout error | Timeout classification path. |

### D) Summary Step: Completion/Result Precedence Matrix

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

### E) Summary Step: Apply Interaction Matrix

Test file: `web/__test__/components/Onboarding/OnboardingSummaryStep.test.ts`

| Case | User action | Expected behavior |
| --- | --- | --- |
| A1 | Click Apply twice while first run in progress | Second click ignored; operations not duplicated; modal lock remains active. |

### F) Core Settings Step: Draft Ownership Matrix

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

### G) API Onboarding Service: Init/Identity Matrix

Test file: `api/src/unraid-api/graph/resolvers/customization/onboarding.service.spec.ts`

| Case | Input state | Expected behavior |
| --- | --- | --- |
| B1 | init called twice, tracker complete on second call | First applies, second skips (idempotent). |
| B2 | identity contains only `serverName` | Send only `NAME` plus required apply args. |
| B3 | identity contains only `model` | Send only `SYS_MODEL` plus required apply args. |
| B4 | identity contains only `comment` | Send only `COMMENT` plus required apply args. |
| B5 | identity has explicit empty `comment` | Send `COMMENT: ""` (do not omit). |
| B6 | identity contains unsafe chars | Send sanitized values (quotes/backslashes stripped). |
| B7 | banner copy fails + case model write fails | Continue to identity apply; do not hard-stop chain. |

### H) Modal Bypass Matrix

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

## How To Run The Targeted Suites

From repo root:

```bash
pnpm --filter @unraid/web exec vitest run __test__/components/Onboarding/OnboardingSummaryStep.test.ts
pnpm --filter @unraid/web exec vitest run __test__/components/Onboarding/OnboardingCoreSettingsStep.test.ts
pnpm --filter @unraid/api exec vitest run src/unraid-api/graph/resolvers/customization/onboarding.service.spec.ts
```
