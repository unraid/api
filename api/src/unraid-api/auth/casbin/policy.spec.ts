import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { Model as CasbinModel, newEnforcer, StringAdapter } from 'casbin';
import { describe, expect, it } from 'vitest';

import { CASBIN_MODEL } from '@app/unraid-api/auth/casbin/model.js';
import { BASE_POLICY } from '@app/unraid-api/auth/casbin/policy.js';

describe('Casbin Policy - VIEWER role restrictions', () => {
    it('should validate matcher does not allow empty policies', async () => {
        // Test that empty policies don't match everything
        const model = new CasbinModel();
        model.loadModelFromText(CASBIN_MODEL);

        // Test with a policy that has an empty object
        const emptyPolicy = `p, VIEWER, , ${AuthAction.READ_ANY}`;
        const adapter = new StringAdapter(emptyPolicy);
        const enforcer = await newEnforcer(model, adapter);

        // Empty policy should not match a real resource
        const canReadApiKey = await enforcer.enforce(Role.VIEWER, Resource.API_KEY, AuthAction.READ_ANY);
        expect(canReadApiKey).toBe(false);
    });

    it('should deny VIEWER role access to API_KEY resource', async () => {
        // Create enforcer with actual policy
        const model = new CasbinModel();
        model.loadModelFromText(CASBIN_MODEL);
        const adapter = new StringAdapter(BASE_POLICY);
        const enforcer = await newEnforcer(model, adapter);

        // Test that VIEWER cannot access API_KEY with any action
        const canReadApiKey = await enforcer.enforce(Role.VIEWER, Resource.API_KEY, AuthAction.READ_ANY);
        const canCreateApiKey = await enforcer.enforce(
            Role.VIEWER,
            Resource.API_KEY,
            AuthAction.CREATE_ANY
        );
        const canUpdateApiKey = await enforcer.enforce(
            Role.VIEWER,
            Resource.API_KEY,
            AuthAction.UPDATE_ANY
        );
        const canDeleteApiKey = await enforcer.enforce(
            Role.VIEWER,
            Resource.API_KEY,
            AuthAction.DELETE_ANY
        );

        expect(canReadApiKey).toBe(false);
        expect(canCreateApiKey).toBe(false);
        expect(canUpdateApiKey).toBe(false);
        expect(canDeleteApiKey).toBe(false);
    });

    it('should allow VIEWER role access to other resources', async () => {
        // Create enforcer with actual policy
        const model = new CasbinModel();
        model.loadModelFromText(CASBIN_MODEL);
        const adapter = new StringAdapter(BASE_POLICY);
        const enforcer = await newEnforcer(model, adapter);

        // Test that VIEWER can read other resources
        const canReadDocker = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, AuthAction.READ_ANY);
        const canReadArray = await enforcer.enforce(Role.VIEWER, Resource.ARRAY, AuthAction.READ_ANY);
        const canReadConfig = await enforcer.enforce(Role.VIEWER, Resource.CONFIG, AuthAction.READ_ANY);
        const canReadVms = await enforcer.enforce(Role.VIEWER, Resource.VMS, AuthAction.READ_ANY);

        expect(canReadDocker).toBe(true);
        expect(canReadArray).toBe(true);
        expect(canReadConfig).toBe(true);
        expect(canReadVms).toBe(true);

        // But VIEWER cannot write to these resources
        const canUpdateDocker = await enforcer.enforce(
            Role.VIEWER,
            Resource.DOCKER,
            AuthAction.UPDATE_ANY
        );
        const canDeleteArray = await enforcer.enforce(
            Role.VIEWER,
            Resource.ARRAY,
            AuthAction.DELETE_ANY
        );

        expect(canUpdateDocker).toBe(false);
        expect(canDeleteArray).toBe(false);
    });

    it('should allow ADMIN role full access to API_KEY resource', async () => {
        // Create enforcer with actual policy
        const model = new CasbinModel();
        model.loadModelFromText(CASBIN_MODEL);
        const adapter = new StringAdapter(BASE_POLICY);
        const enforcer = await newEnforcer(model, adapter);

        // Test that ADMIN can access API_KEY with all actions
        const canReadApiKey = await enforcer.enforce(Role.ADMIN, Resource.API_KEY, AuthAction.READ_ANY);
        const canCreateApiKey = await enforcer.enforce(
            Role.ADMIN,
            Resource.API_KEY,
            AuthAction.CREATE_ANY
        );
        const canUpdateApiKey = await enforcer.enforce(
            Role.ADMIN,
            Resource.API_KEY,
            AuthAction.UPDATE_ANY
        );
        const canDeleteApiKey = await enforcer.enforce(
            Role.ADMIN,
            Resource.API_KEY,
            AuthAction.DELETE_ANY
        );

        expect(canReadApiKey).toBe(true);
        expect(canCreateApiKey).toBe(true);
        expect(canUpdateApiKey).toBe(true);
        expect(canDeleteApiKey).toBe(true);
    });

    it('should ensure VIEWER permissions exclude API_KEY in generated policy', () => {
        // Verify that the generated policy string doesn't contain VIEWER + API_KEY combination
        expect(BASE_POLICY).toContain(`p, ${Role.VIEWER}, ${Resource.DOCKER}, ${AuthAction.READ_ANY}`);
        expect(BASE_POLICY).toContain(`p, ${Role.VIEWER}, ${Resource.ARRAY}, ${AuthAction.READ_ANY}`);
        expect(BASE_POLICY).not.toContain(
            `p, ${Role.VIEWER}, ${Resource.API_KEY}, ${AuthAction.READ_ANY}`
        );

        // Count VIEWER permissions - should be total resources minus API_KEY
        const viewerPermissionLines = BASE_POLICY.split('\n').filter((line) =>
            line.startsWith(`p, ${Role.VIEWER},`)
        );
        const totalResources = Object.values(Resource).length;
        expect(viewerPermissionLines.length).toBe(totalResources - 1); // All resources except API_KEY
    });

    it('should inherit GUEST permissions for VIEWER role', async () => {
        // Create enforcer with actual policy
        const model = new CasbinModel();
        model.loadModelFromText(CASBIN_MODEL);
        const adapter = new StringAdapter(BASE_POLICY);
        const enforcer = await newEnforcer(model, adapter);

        // VIEWER inherits from GUEST, so should have access to ME resource
        const canReadMe = await enforcer.enforce(Role.VIEWER, Resource.ME, AuthAction.READ_ANY);
        expect(canReadMe).toBe(true);
    });
});
