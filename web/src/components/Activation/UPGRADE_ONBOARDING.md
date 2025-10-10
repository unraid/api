# Upgrade Onboarding System

## Overview

This system shows contextual onboarding steps to users when they upgrade their Unraid OS to a new version. It tracks the last seen OS version in the API config and allows you to define which steps should be shown for specific version upgrades.

## How It Works

### Backend (API)

1. **Version Tracking** - `api/src/unraid-api/config/api-config.module.ts`
   - On boot, compares current OS version with `lastSeenOsVersion` in API config
   - Automatically updates `lastSeenOsVersion` when version changes
   - Persists to `/boot/config/modules/api.json`

2. **GraphQL API** - `api/src/unraid-api/graph/resolvers/info/versions/`
   - Exposes `info.versions.upgrade` field with:
     - `isUpgrade`: Boolean indicating if OS version changed
     - `previousVersion`: Last seen OS version
     - `currentVersion`: Current OS version

### Frontend (Web)

1. **Release Configuration** - `releaseConfigs.ts`
   - Define which steps to show for specific version upgrades
   - Support conditional steps with async functions
   - Example:

   ```typescript
   {
     version: '7.0.0',
     steps: [
       { id: 'timezone', required: true },
       { 
         id: 'plugins', 
         required: false,
         condition: async () => {
           return checkSomeCondition();
         }
       },
     ],
   }
   ```

2. **Upgrade Onboarding Store** - `store/upgradeOnboarding.ts`
   - Queries upgrade info from GraphQL
   - Evaluates release config to determine which steps to show
   - Provides `shouldShowUpgradeOnboarding` computed property

3. **Unified Activation Modal** - `ActivationModal.vue`
   - Handles both fresh install and upgrade onboarding modes
   - Automatically detects which mode based on system state
   - Displays relevant steps for each mode
   - Reuses existing step components (timezone, plugins)
   - Persists "hidden" state per mode to session storage

## Adding New Steps

### 1. Create the Step Component

Create a new component like `ActivationTimezoneStep.vue` with:
```vue
<script setup>
export interface Props {
  t: ComposerTranslation;
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}
</script>
```

### 2. Add Step ID Type

In `releaseConfigs.ts`, update the step ID type:
```typescript
export interface ReleaseStepConfig {
  id: 'timezone' | 'plugins' | 'your-new-step';
  // ...
}
```

### 3. Add Step to Modal

In `ActivationModal.vue`, add a section:

```vue
<div v-else-if="currentStep === 'your-new-step'" class="flex w-full flex-col items-center">
  <YourNewStepComponent
    :t="t"
    :on-complete="goToNextStep"
    :on-skip="goToNextStep"
    :show-skip="isUpgradeMode ? !currentStepConfig?.required : false"
  />
</div>
```

### 4. Configure for Release

In `releaseConfigs.ts`, add to `releaseConfigs` array:

```typescript
{
  version: '7.1.0',
  steps: [
    { 
      id: 'your-new-step', 
      required: true,
      condition: async () => {
        return true;
      }
    },
  ],
}
```

## Integration

The `ActivationModal` is already integrated into the app and automatically handles both fresh install and upgrade modes. No additional setup needed!

## Testing

To test the upgrade flow:

1. Edit `/boot/config/modules/api.json` and set `lastSeenOsVersion` to an older version
2. Restart the API
3. The modal should appear on next page load with relevant steps

## Notes

- Fresh installs (no `lastSeenOsVersion`) won't trigger upgrade onboarding
- The modal automatically switches between fresh install and upgrade modes
- Each mode can be dismissed independently (stored in sessionStorage)
- Version comparison uses semver for reliable ordering
- The same modal component handles both modes for consistency
