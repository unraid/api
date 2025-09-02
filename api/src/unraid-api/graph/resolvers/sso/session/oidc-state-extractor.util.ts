import { UnauthorizedException } from '@nestjs/common';

import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-state.service.js';

export interface StateExtractionResult {
    providerId: string;
    originalState: string;
    clientState?: string;
    redirectUri?: string;
}

/**
 * Utility to extract and validate OIDC state information consistently
 * across authorize and callback endpoints
 */
export class OidcStateExtractor {
    /**
     * Extract provider ID from state without validation (for routing purposes)
     */
    static extractProviderFromState(
        state: string,
        stateService: OidcStateService
    ): { providerId: string; originalState: string } {
        // Use the state service's extraction method
        const providerId = stateService.extractProviderFromState(state);

        return {
            providerId: providerId || '',
            originalState: state,
        };
    }

    /**
     * Extract provider ID and validate the full encrypted state
     */
    static async extractAndValidateState(
        state: string,
        stateService: OidcStateService
    ): Promise<StateExtractionResult> {
        // First extract provider ID for routing
        const { providerId } = this.extractProviderFromState(state, stateService);

        if (!providerId) {
            throw new UnauthorizedException('Invalid state format: missing provider ID');
        }

        // Then validate the full encrypted state
        const stateValidation = await stateService.validateSecureState(state, providerId);
        if (!stateValidation.isValid) {
            throw new UnauthorizedException(`Invalid state: ${stateValidation.error}`);
        }

        return {
            providerId,
            originalState: state,
            clientState: stateValidation.clientState,
            redirectUri: stateValidation.redirectUri,
        };
    }
}
