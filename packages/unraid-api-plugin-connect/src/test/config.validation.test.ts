import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import * as fc from 'fast-check';

import { MyServersConfig, DynamicRemoteAccessType } from '../model/connect-config.model.js';
import { ConnectConfigPersister } from '../service/config.persistence.js';

describe('MyServersConfig Validation', () => {
    let persister: ConnectConfigPersister;
    let validConfig: Partial<MyServersConfig>;

    beforeEach(() => {
        const configService = {
            getOrThrow: vi.fn().mockReturnValue('/mock/path'),
            get: vi.fn(),
            set: vi.fn(),
            changes$: {
                pipe: vi.fn(() => ({
                    subscribe: vi.fn(),
                })),
            },
        } as any;

        persister = new ConnectConfigPersister(configService as any);
        
        validConfig = {
            wanaccess: false,
            wanport: 0,
            upnpEnabled: false,
            apikey: 'test-api-key',
            localApiKey: 'test-local-key',
            email: 'test@example.com',
            username: 'testuser',
            avatar: 'https://example.com/avatar.jpg',
            regWizTime: '2024-01-01T00:00:00Z',
            dynamicRemoteAccessType: DynamicRemoteAccessType.DISABLED,
            upnpStatus: null,
        };
    });

    describe('Email validation', () => {
        it('should accept valid email addresses', async () => {
            const config = { ...validConfig, email: 'user@example.com' };
            const result = await persister.validate(config);
            expect(result.email).toBe('user@example.com');
        });

        it('should accept empty string for email', async () => {
            const config = { ...validConfig, email: '' };
            const result = await persister.validate(config);
            expect(result.email).toBe('');
        });

        it('should accept null for email', async () => {
            const config = { ...validConfig, email: null };
            const result = await persister.validate(config);
            expect(result.email).toBeNull();
        });

        it('should reject invalid email addresses', async () => {
            const config = { ...validConfig, email: 'invalid-email' };
            await expect(persister.validate(config)).rejects.toThrow();
        });

        it('should reject malformed email addresses', async () => {
            const config = { ...validConfig, email: '@example.com' };
            await expect(persister.validate(config)).rejects.toThrow();
        });
    });

    describe('Boolean field validation', () => {
        it('should accept boolean values for wanaccess', async () => {
            const config = { ...validConfig, wanaccess: true };
            const result = await persister.validate(config);
            expect(result.wanaccess).toBe(true);
        });

        it('should accept boolean values for upnpEnabled', async () => {
            const config = { ...validConfig, upnpEnabled: true };
            const result = await persister.validate(config);
            expect(result.upnpEnabled).toBe(true);
        });

        it('should reject non-boolean values for wanaccess', async () => {
            const config = { ...validConfig, wanaccess: 'yes' as any };
            await expect(persister.validate(config)).rejects.toThrow();
        });

        it('should reject non-boolean values for upnpEnabled', async () => {
            const config = { ...validConfig, upnpEnabled: 'no' as any };
            await expect(persister.validate(config)).rejects.toThrow();
        });
    });

    describe('Number field validation', () => {
        it('should accept number values for wanport', async () => {
            const config = { ...validConfig, wanport: 8080 };
            const result = await persister.validate(config);
            expect(result.wanport).toBe(8080);
        });

        it('should accept null for optional number fields', async () => {
            const config = { ...validConfig, wanport: null };
            const result = await persister.validate(config);
            expect(result.wanport).toBeNull();
        });

        it('should reject non-number values for wanport', async () => {
            const config = { ...validConfig, wanport: '8080' as any };
            await expect(persister.validate(config)).rejects.toThrow();
        });
    });

    describe('String field validation', () => {
        it('should accept string values for required string fields', async () => {
            const config = { ...validConfig };
            const result = await persister.validate(config);
            expect(result.apikey).toBe(validConfig.apikey);
            expect(result.localApiKey).toBe(validConfig.localApiKey);
            expect(result.username).toBe(validConfig.username);
        });

        it('should reject non-string values for required string fields', async () => {
            const config = { ...validConfig, apikey: 123 as any };
            await expect(persister.validate(config)).rejects.toThrow();
        });
    });

    describe('Enum validation', () => {
        it('should accept valid enum values for dynamicRemoteAccessType', async () => {
            const config = { ...validConfig, dynamicRemoteAccessType: DynamicRemoteAccessType.STATIC };
            const result = await persister.validate(config);
            expect(result.dynamicRemoteAccessType).toBe(DynamicRemoteAccessType.STATIC);
        });

        it('should reject invalid enum values for dynamicRemoteAccessType', async () => {
            const config = { ...validConfig, dynamicRemoteAccessType: 'INVALID' as any };
            await expect(persister.validate(config)).rejects.toThrow();
        });
    });

    describe('Property-based validation testing', () => {
        it('should accept valid email addresses generated by faker', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.constant(null).map(() => faker.internet.email()),
                    async (email) => {
                        const config = { ...validConfig, email };
                        const result = await persister.validate(config);
                        expect(result.email).toBe(email);
                    }
                ),
                { numRuns: 20 }
            );
        });

        it('should handle various boolean combinations', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.boolean(),
                    fc.boolean(),
                    async (wanaccess, upnpEnabled) => {
                        const config = { ...validConfig, wanaccess, upnpEnabled };
                        const result = await persister.validate(config);
                        expect(result.wanaccess).toBe(wanaccess);
                        expect(result.upnpEnabled).toBe(upnpEnabled);
                    }
                ),
                { numRuns: 10 }
            );
        });

        it('should handle valid port numbers', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 0, max: 65535 }),
                    async (port) => {
                        const config = { ...validConfig, wanport: port };
                        const result = await persister.validate(config);
                        expect(result.wanport).toBe(port);
                        expect(typeof result.wanport).toBe('number');
                    }
                ),
                { numRuns: 20 }
            );
        });

        it('should handle various usernames and API keys', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.constant(null).map(() => faker.internet.username()),
                    fc.constant(null).map(() => `unraid_${faker.string.alphanumeric({ length: 32 })}`),
                    fc.constant(null).map(() => faker.string.alphanumeric({ length: 64 })),
                    async (username, apikey, localApiKey) => {
                        const config = { ...validConfig, username, apikey, localApiKey };
                        const result = await persister.validate(config);
                        expect(result.username).toBe(username);
                        expect(result.apikey).toBe(apikey);
                        expect(result.localApiKey).toBe(localApiKey);
                    }
                ),
                { numRuns: 15 }
            );
        });

        it('should handle various enum values for dynamicRemoteAccessType', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(
                        DynamicRemoteAccessType.DISABLED,
                        DynamicRemoteAccessType.STATIC,
                        DynamicRemoteAccessType.UPNP
                    ),
                    async (dynamicRemoteAccessType) => {
                        const config = { ...validConfig, dynamicRemoteAccessType };
                        const result = await persister.validate(config);
                        expect(result.dynamicRemoteAccessType).toBe(dynamicRemoteAccessType);
                    }
                ),
                { numRuns: 10 }
            );
        });

        it('should reject invalid enum values', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }).filter(s => 
                        !Object.values(DynamicRemoteAccessType).includes(s as any)
                    ),
                    async (invalidEnumValue) => {
                        const config = { ...validConfig, dynamicRemoteAccessType: invalidEnumValue };
                        await expect(persister.validate(config)).rejects.toThrow();
                    }
                ),
                { numRuns: 10 }
            );
        });

        it('should reject invalid email formats using fuzzing', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }).filter(s => 
                        !s.includes('@') || s.startsWith('@') || s.endsWith('@')
                    ),
                    async (invalidEmail) => {
                        const config = { ...validConfig, email: invalidEmail };
                        await expect(persister.validate(config)).rejects.toThrow();
                    }
                ),
                { numRuns: 15 }
            );
        });

        it('should accept any number values for wanport (range validation is done at form level)', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: -100000, max: 100000 }),
                    async (port) => {
                        const config = { ...validConfig, wanport: port };
                        const result = await persister.validate(config);
                        expect(result.wanport).toBe(port);
                        expect(typeof result.wanport).toBe('number');
                    }
                ),
                { numRuns: 10 }
            );
        });
    });

    describe('Complete config validation', () => {
        it('should validate a complete valid config', async () => {
            const result = await persister.validate(validConfig);
            expect(result).toBeDefined();
            expect(result.email).toBe(validConfig.email);
            expect(result.username).toBe(validConfig.username);
            expect(result.wanaccess).toBe(validConfig.wanaccess);
            expect(result.upnpEnabled).toBe(validConfig.upnpEnabled);
        });

        it('should validate config with minimal required fields using faker data', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.constant(null).map(() => ({
                        email: faker.internet.email(),
                        username: faker.internet.username(),
                        apikey: `unraid_${faker.string.alphanumeric({ length: 32 })}`,
                        localApiKey: faker.string.alphanumeric({ length: 64 }),
                        avatar: faker.image.avatarGitHub(),
                        regWizTime: faker.date.past().toISOString(),
                    })),
                    async (fakerData) => {
                        const minimalConfig = {
                            wanaccess: false,
                            upnpEnabled: false,
                            wanport: 0,
                            dynamicRemoteAccessType: DynamicRemoteAccessType.DISABLED,
                            upnpStatus: null,
                            ...fakerData,
                        };

                        const result = await persister.validate(minimalConfig);
                        expect(result.email).toBe(fakerData.email);
                        expect(result.username).toBe(fakerData.username);
                        expect(result.apikey).toBe(fakerData.apikey);
                        expect(result.localApiKey).toBe(fakerData.localApiKey);
                    }
                ),
                { numRuns: 10 }
            );
        });
    });
}); 