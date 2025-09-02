import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import {
    AuthorizationOperator,
    AuthorizationRuleMode,
    OidcAuthorizationRule,
    OidcProvider,
} from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';

interface JwtClaims {
    sub?: string;
    email?: string;
    name?: string;
    hd?: string; // Google hosted domain
    [claim: string]: unknown;
}

@Injectable()
export class OidcAuthorizationService {
    private readonly logger = new Logger(OidcAuthorizationService.name);

    /**
     * Check authorization based on rules
     * This will throw a helpful error if misconfigured or unauthorized
     */
    async checkAuthorization(provider: OidcProvider, claims: JwtClaims): Promise<void> {
        this.logger.debug(
            `Checking authorization for provider ${provider.id} with ${provider.authorizationRules?.length || 0} rules`
        );
        this.logger.debug(`Available claims: ${Object.keys(claims).join(', ')}`);
        this.logger.debug(
            `Authorization rule mode: ${provider.authorizationRuleMode || AuthorizationRuleMode.OR}`
        );

        // If no authorization rules are specified, throw a helpful error
        if (!provider.authorizationRules || provider.authorizationRules.length === 0) {
            throw new UnauthorizedException(
                `Login failed: The ${provider.name} provider has no authorization rules configured. ` +
                    `Please configure authorization rules.`
            );
        }

        this.logger.debug('Authorization rules to evaluate: %o', provider.authorizationRules);

        // Evaluate the rules
        const ruleMode = provider.authorizationRuleMode || AuthorizationRuleMode.OR;
        const isAuthorized = this.evaluateAuthorizationRules(
            provider.authorizationRules,
            claims,
            ruleMode
        );

        this.logger.debug(`Authorization result: ${isAuthorized}`);

        if (!isAuthorized) {
            // Log authorization failure with safe claim representation (no PII)
            const availableClaimKeys = Object.keys(claims).join(', ');
            this.logger.warn(
                `Authorization failed for provider ${provider.name}, user ${claims.sub}, available claim keys: [${availableClaimKeys}]`
            );
            throw new UnauthorizedException(
                `Access denied: Your account does not meet the authorization requirements for ${provider.name}.`
            );
        }

        this.logger.debug(`Authorization successful for user ${claims.sub}`);
    }

    private evaluateAuthorizationRules(
        rules: OidcAuthorizationRule[],
        claims: JwtClaims,
        mode: AuthorizationRuleMode = AuthorizationRuleMode.OR
    ): boolean {
        // No rules means no authorization
        if (rules.length === 0) {
            return false;
        }

        if (mode === AuthorizationRuleMode.AND) {
            // All rules must pass (AND logic)
            return rules.every((rule) => this.evaluateRule(rule, claims));
        } else {
            // Any rule can pass (OR logic) - default behavior
            // Multiple rules act as alternative authorization paths
            return rules.some((rule) => this.evaluateRule(rule, claims));
        }
    }

    private evaluateRule(rule: OidcAuthorizationRule, claims: JwtClaims): boolean {
        const claimValue = claims[rule.claim];

        this.logger.verbose(
            `Evaluating rule for claim ${rule.claim}: { claimType: ${typeof claimValue}, isArray: ${Array.isArray(claimValue)}, ruleOperator: ${rule.operator}, ruleValuesCount: ${rule.value.length} }`
        );

        if (claimValue === undefined || claimValue === null) {
            this.logger.verbose(`Claim ${rule.claim} not found in token`);
            return false;
        }

        // Handle non-array, non-string objects
        if (typeof claimValue === 'object' && claimValue !== null && !Array.isArray(claimValue)) {
            this.logger.warn(
                `unexpected JWT claim value encountered - claim ${rule.claim} has unsupported object type (keys: [${Object.keys(claimValue as Record<string, unknown>).join(', ')}])`
            );
            return false;
        }

        // Handle array claims - evaluate rule against each array element
        if (Array.isArray(claimValue)) {
            this.logger.verbose(
                `Processing array claim ${rule.claim} with ${claimValue.length} elements`
            );

            // For array claims, check if ANY element in the array matches the rule
            const arrayResult = claimValue.some((element) => {
                // Skip non-string elements
                if (
                    typeof element !== 'string' &&
                    typeof element !== 'number' &&
                    typeof element !== 'boolean'
                ) {
                    this.logger.verbose(`Skipping non-primitive element in array: ${typeof element}`);
                    return false;
                }

                const elementValue = String(element);
                return this.evaluateSingleValue(elementValue, rule);
            });

            this.logger.verbose(`Array evaluation result for claim ${rule.claim}: ${arrayResult}`);
            return arrayResult;
        }

        // Handle single value claims (string, number, boolean)
        const value = String(claimValue);
        this.logger.verbose(`Processing single value claim ${rule.claim}`);

        return this.evaluateSingleValue(value, rule);
    }

    private evaluateSingleValue(value: string, rule: OidcAuthorizationRule): boolean {
        let result: boolean;
        switch (rule.operator) {
            case AuthorizationOperator.EQUALS:
                result = rule.value.some((v) => value === v);
                this.logger.verbose(`EQUALS check: evaluated for claim ${rule.claim}: ${result}`);
                return result;

            case AuthorizationOperator.CONTAINS:
                result = rule.value.some((v) => value.includes(v));
                this.logger.verbose(`CONTAINS check: evaluated for claim ${rule.claim}: ${result}`);
                return result;

            case AuthorizationOperator.STARTS_WITH:
                result = rule.value.some((v) => value.startsWith(v));
                this.logger.verbose(`STARTS_WITH check: evaluated for claim ${rule.claim}: ${result}`);
                return result;

            case AuthorizationOperator.ENDS_WITH:
                result = rule.value.some((v) => value.endsWith(v));
                this.logger.verbose(`ENDS_WITH check: evaluated for claim ${rule.claim}: ${result}`);
                return result;

            default:
                this.logger.error(`Unknown authorization operator: ${rule.operator}`);
                return false;
        }
    }
}
