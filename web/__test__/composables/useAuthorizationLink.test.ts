import { describe, it, expect } from 'vitest';
import { useAuthorizationLink } from '~/composables/useAuthorizationLink.js';
import { Role, Resource, AuthAction } from '~/composables/gql/graphql.js';

// Mock window.location for the tests
Object.defineProperty(window, 'location', {
  value: {
    search: '',
  },
  writable: true,
});

describe('useAuthorizationLink', () => {
  it('should convert role scopes to form data', () => {
    const params = new URLSearchParams({
      name: 'MyApp',
      description: 'My test application',
      scopes: 'role:admin,role:viewer',
      redirect_uri: 'https://example.com/callback',
    });

    const { formData, displayAppName, hasPermissions, permissionsSummary } = useAuthorizationLink(params);

    expect(formData.value).toEqual({
      name: 'MyApp',
      description: 'My test application',
      roles: [Role.ADMIN, Role.VIEWER],
      customPermissions: [],
    });

    expect(displayAppName.value).toBe('MyApp');
    expect(hasPermissions.value).toBe(true);
    expect(permissionsSummary.value).toBe('2 role(s)');
  });

  it('should group resources by their action sets', () => {
    const params = new URLSearchParams({
      name: 'Docker Manager',
      scopes: 'docker:read_any,docker:update_any,vms:read_any',
    });

    const { formData, hasPermissions, permissionsSummary } = useAuthorizationLink(params);

    // docker has read_any+update_any, vms only has read_any - these should be separate groups
    expect(formData.value.customPermissions!).toHaveLength(2);
    
    // Find the group with just READ_ANY
    const readOnlyGroup = formData.value.customPermissions!.find(
      p => p.actions.length === 1 && p.actions[0] === AuthAction.READ_ANY
    );
    expect(readOnlyGroup).toBeDefined();
    expect(readOnlyGroup?.resources).toEqual([Resource.VMS]);
    
    // Find the group with READ_ANY and UPDATE_ANY
    const readUpdateGroup = formData.value.customPermissions!.find(
      p => p.actions.length === 2 && 
          p.actions.includes(AuthAction.READ_ANY) &&
          p.actions.includes(AuthAction.UPDATE_ANY)
    );
    expect(readUpdateGroup).toBeDefined();
    expect(readUpdateGroup?.resources).toEqual([Resource.DOCKER]);

    expect(hasPermissions.value).toBe(true);
    expect(permissionsSummary.value).toBe('3 permission(s)');
  });

  it('should handle mixed role and permission scopes', () => {
    const params = new URLSearchParams({
      name: 'Mixed Access App',
      scopes: 'role:admin,docker:read_any,vms:*',
    });

    const { formData, hasPermissions, permissionsSummary } = useAuthorizationLink(params);

    expect(formData.value.roles).toEqual([Role.ADMIN]);
    expect(formData.value.customPermissions!).toHaveLength(2);
    
    // Docker should have just read permission
    const dockerGroup = formData.value.customPermissions!.find(
      p => p.resources.includes(Resource.DOCKER)
    );
    expect(dockerGroup).toBeDefined();
    expect(dockerGroup?.actions).toEqual([AuthAction.READ_ANY]);
    
    // VMs should have all CRUD permissions from wildcard
    const vmsGroup = formData.value.customPermissions!.find(
      p => p.resources.includes(Resource.VMS)
    );
    expect(vmsGroup).toBeDefined();
    expect(vmsGroup?.actions).toContain(AuthAction.CREATE_ANY);
    expect(vmsGroup?.actions).toContain(AuthAction.READ_ANY);
    expect(vmsGroup?.actions).toContain(AuthAction.UPDATE_ANY);
    expect(vmsGroup?.actions).toContain(AuthAction.DELETE_ANY);

    expect(hasPermissions.value).toBe(true);
    expect(permissionsSummary.value).toBe('1 role(s), 2 permission(s)');
  });

  it('should handle wildcard permissions correctly', () => {
    const params = new URLSearchParams({
      name: 'Full Access App',
      scopes: 'docker:*',
    });

    const { hasPermissions, permissionsSummary } = useAuthorizationLink(params);

    expect(hasPermissions.value).toBe(true);
    expect(permissionsSummary.value).toBe('1 permission(s)');
  });

  it('should handle empty scopes gracefully', () => {
    const params = new URLSearchParams({
      name: 'No Permissions App',
      scopes: '',
    });

    const { formData, hasPermissions, permissionsSummary } = useAuthorizationLink(params);

    expect(formData.value).toEqual({
      name: 'No Permissions App',
      description: '',
      roles: [],
      customPermissions: [],
    });

    expect(hasPermissions.value).toBe(false);
    expect(permissionsSummary.value).toBe('');
  });

  it('should handle app names ending with " API Key"', () => {
    const params = new URLSearchParams({
      name: 'MyApp API Key',
      scopes: 'role:viewer',
    });

    const { formData, displayAppName } = useAuthorizationLink(params);

    expect(displayAppName.value).toBe('MyApp');
    // Name should be used as-is without appending
    expect(formData.value.name).toBe('MyApp API Key');
  });

  it('should handle invalid scopes gracefully', () => {
    const params = new URLSearchParams({
      name: 'Invalid Scopes App',
      scopes: 'role:invalid_role,unknown_resource:read,docker:invalid_action',
    });

    const { hasPermissions, permissionsSummary } = useAuthorizationLink(params);

    expect(hasPermissions.value).toBe(true); // Has scopes, even if invalid
    expect(permissionsSummary.value).toBe('1 role(s), 2 permission(s)');
  });

  it('should use default values when parameters are missing', () => {
    const params = new URLSearchParams(); // Empty params

    const { formData, displayAppName } = useAuthorizationLink(params);

    expect(formData.value.name).toBe('Unknown Application');
    expect(displayAppName.value).toBe('Unknown Application');
  });

  describe('permission grouping and preservation', () => {
    it('should group multiple resources with same actions into single permission group', () => {
      const params = new URLSearchParams({
        name: 'Multi-Resource Reader',
        scopes: 'connect:read_any,disk:read_any,docker:read_any',
      });

      const { formData } = useAuthorizationLink(params);

      // All have same action (read), so should be in one group
      expect(formData.value.customPermissions!).toHaveLength(1);
      expect(formData.value.customPermissions![0]).toEqual({
        resources: [Resource.CONNECT, Resource.DISK, Resource.DOCKER],
        actions: [AuthAction.READ_ANY],
      });
    });

    it('should create separate groups for resources with different action sets', () => {
      const params = new URLSearchParams({
        name: 'Mixed Actions App',
        scopes: 'docker:read_any,docker:update_any,vms:create_any,vms:delete_any',
      });

      const { formData } = useAuthorizationLink(params);

      // Docker has read+update, VMs has create+delete - these should be separate
      expect(formData.value.customPermissions!).toHaveLength(2);
      
      const dockerGroup = formData.value.customPermissions!.find(
        p => p.resources.includes(Resource.DOCKER)
      );
      expect(dockerGroup).toBeDefined();
      expect(dockerGroup?.actions).toContain(AuthAction.READ_ANY);
      expect(dockerGroup?.actions).toContain(AuthAction.UPDATE_ANY);
      
      const vmsGroup = formData.value.customPermissions!.find(
        p => p.resources.includes(Resource.VMS)
      );
      expect(vmsGroup).toBeDefined();
      expect(vmsGroup?.actions).toContain(AuthAction.CREATE_ANY);
      expect(vmsGroup?.actions).toContain(AuthAction.DELETE_ANY);
    });

    it('should handle duplicate scopes correctly', () => {
      const params = new URLSearchParams({
        name: 'Duplicate Scopes App',
        scopes: 'docker:read_any,docker:read_any,vms:update_any,vms:update_any',
      });

      const { formData } = useAuthorizationLink(params);

      // Docker has read, VMs has update - different actions so separate groups
      expect(formData.value.customPermissions!).toHaveLength(2);
      
      const readGroup = formData.value.customPermissions!.find(
        p => p.actions.includes(AuthAction.READ_ANY)
      );
      expect(readGroup?.resources).toEqual([Resource.DOCKER]);
      
      const updateGroup = formData.value.customPermissions!.find(
        p => p.actions.includes(AuthAction.UPDATE_ANY)
      );
      expect(updateGroup?.resources).toEqual([Resource.VMS]);
    });

    it('should preserve wildcard expansion for resources', () => {
      const params = new URLSearchParams({
        name: 'Wildcard App',
        scopes: 'docker:*,vms:read_any',
      });

      const { formData } = useAuthorizationLink(params);

      // Docker has all CRUD, VMs has just read - different action sets so separate groups
      expect(formData.value.customPermissions!).toHaveLength(2);
      
      const dockerGroup = formData.value.customPermissions!.find(
        p => p.resources.includes(Resource.DOCKER)
      );
      expect(dockerGroup).toBeDefined();
      // Should have all CRUD actions from wildcard
      expect(dockerGroup?.actions).toContain(AuthAction.CREATE_ANY);
      expect(dockerGroup?.actions).toContain(AuthAction.READ_ANY);
      expect(dockerGroup?.actions).toContain(AuthAction.UPDATE_ANY);
      expect(dockerGroup?.actions).toContain(AuthAction.DELETE_ANY);
      
      const vmsGroup = formData.value.customPermissions!.find(
        p => p.resources.includes(Resource.VMS)
      );
      expect(vmsGroup).toBeDefined();
      expect(vmsGroup?.actions).toEqual([AuthAction.READ_ANY]);
    });

    it('should handle complex permission combinations', () => {
      const params = new URLSearchParams({
        name: 'Complex Permissions App',
        scopes: 'connect:read_any,disk:read_any,docker:*,vms:update_any,vms:delete_any,dashboard:read_any',
      });

      const { formData } = useAuthorizationLink(params);

      // Should group by action sets:
      // - connect, disk, dashboard all have just read (group 1)
      // - docker has all CRUD from wildcard (group 2)
      // - vms has update+delete (group 3)
      expect(formData.value.customPermissions!).toHaveLength(3);
      
      // Find read-only group (connect, disk, dashboard)
      const readOnlyGroup = formData.value.customPermissions!.find(
        p => p.actions.length === 1 && p.actions[0] === AuthAction.READ_ANY
      );
      expect(readOnlyGroup).toBeDefined();
      expect(readOnlyGroup?.resources).toContain(Resource.CONNECT);
      expect(readOnlyGroup?.resources).toContain(Resource.DISK);
      expect(readOnlyGroup?.resources).toContain(Resource.DASHBOARD);

      // Find full CRUD group (docker with wildcard)
      const fullCrudGroup = formData.value.customPermissions!.find(
        p => p.actions.length === 4 && p.resources.includes(Resource.DOCKER)
      );
      expect(fullCrudGroup).toBeDefined();
      expect(fullCrudGroup?.actions).toContain(AuthAction.CREATE_ANY);
      expect(fullCrudGroup?.actions).toContain(AuthAction.READ_ANY);
      expect(fullCrudGroup?.actions).toContain(AuthAction.UPDATE_ANY);
      expect(fullCrudGroup?.actions).toContain(AuthAction.DELETE_ANY);

      // Find update+delete group (vms)
      const updateDeleteGroup = formData.value.customPermissions!.find(
        p => p.resources.includes(Resource.VMS)
      );
      expect(updateDeleteGroup).toBeDefined();
      expect(updateDeleteGroup?.actions).toContain(AuthAction.UPDATE_ANY);
      expect(updateDeleteGroup?.actions).toContain(AuthAction.DELETE_ANY);
    });
  });

  describe('efficient scope encoding', () => {
    it('should decode grouped scopes correctly', () => {
      const params = new URLSearchParams({
        name: 'Grouped App',
        scopes: 'docker+vms:read_any+update_any',
      });

      const { formData } = useAuthorizationLink(params);

      // Should decode to a single group with both resources and both actions
      expect(formData.value.customPermissions!).toHaveLength(1);
      expect(formData.value.customPermissions![0].resources).toContain(Resource.DOCKER);
      expect(formData.value.customPermissions![0].resources).toContain(Resource.VMS);
      expect(formData.value.customPermissions![0].actions).toContain(AuthAction.READ_ANY);
      expect(formData.value.customPermissions![0].actions).toContain(AuthAction.UPDATE_ANY);
    });

    it('should handle mixed grouped and individual scopes', () => {
      const params = new URLSearchParams({
        name: 'Mixed Grouped App',
        scopes: 'docker+vms:read_any,dashboard:update_any',
      });

      const { formData } = useAuthorizationLink(params);

      // Should have two groups: docker+vms with read, dashboard with update
      expect(formData.value.customPermissions!).toHaveLength(2);
      
      const readGroup = formData.value.customPermissions!.find(
        p => p.actions.includes(AuthAction.READ_ANY)
      );
      expect(readGroup).toBeDefined();
      expect(readGroup?.resources).toContain(Resource.DOCKER);
      expect(readGroup?.resources).toContain(Resource.VMS);
      
      const updateGroup = formData.value.customPermissions!.find(
        p => p.actions.includes(AuthAction.UPDATE_ANY)
      );
      expect(updateGroup).toBeDefined();
      expect(updateGroup?.resources).toEqual([Resource.DASHBOARD]);
    });
  });
});
