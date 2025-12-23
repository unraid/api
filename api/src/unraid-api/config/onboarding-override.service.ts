import { Injectable } from '@nestjs/common';

import type { OnboardingOverrideState } from '@app/unraid-api/config/onboarding-override.model.js';

@Injectable()
export class OnboardingOverrideService {
    private state: OnboardingOverrideState | null = null;

    getState(): OnboardingOverrideState | null {
        return this.state;
    }

    setState(state: OnboardingOverrideState): void {
        this.state = state;
    }

    clearState(): void {
        this.state = null;
    }
}
