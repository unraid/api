import { Test, TestingModule } from '@nestjs/testing';

import { AuthZService } from 'nest-authz';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Me, Resource, Role, UserAccount } from '@app/graphql/generated/api/types';

import { MeResolver } from './me.resolver';

describe('MeResolver', () => {
    let resolver: MeResolver;
    let authzService: AuthZService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MeResolver,
                {
                    provide: AuthZService,
                    useValue: {
                        checkPermission: vi.fn().mockImplementation((action, resource, possession) => {
                            // Return false for specific test scenarios
                            if (action === 'write' && resource === Resource.ME) {
                                return Promise.resolve(false);
                            }
                            return Promise.resolve(true);
                        }),
                    },
                },
            ],
        }).compile();

        resolver = module.get<MeResolver>(MeResolver);
        authzService = module.get<AuthZService>(AuthZService);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    it('should return user information', async () => {
        const mockUser: UserAccount = {
            id: 'test-id',
            name: 'Test User',
            description: 'Test Description',
            roles: [Role.GUEST],
            permissions: [
                {
                    resource: Resource.ME,
                    actions: ['read'],
                },
            ],
        };

        const result = await resolver.me(mockUser);

        expect(result).toEqual({
            id: mockUser.id,
            name: mockUser.name,
            description: mockUser.description,
            roles: mockUser.roles,
            permissions: mockUser.permissions,
        } as Me);
        expect(result).toBeDefined();
        expect(result.id).toBe(mockUser.id);
        expect(result.name).toBe(mockUser.name);
        expect(result.description).toBe(mockUser.description);
        expect(result.roles).toEqual(expect.arrayContaining([Role.GUEST]));
        expect(result.permissions!).toHaveLength(1);
        expect(result.permissions![0]).toEqual({
            resource: Resource.ME,
            actions: expect.arrayContaining(['read']),
        });
    });
});
