import { buildSchema, FieldNode, GraphQLResolveInfo, parse } from 'graphql';
import { describe, expect, it } from 'vitest';

import { GraphQLFieldHelper } from '@app/unraid-api/utils/graphql-field-helper.js';

describe('GraphQLFieldHelper', () => {
    const schema = buildSchema(`
        type User {
            id: String
            name: String
            email: String
            profile: Profile
            posts: [Post]
            settings: Settings
        }

        type Profile {
            avatar: String
            bio: String
        }

        type Post {
            title: String
            content: String
        }

        type Settings {
            theme: String
            language: String
        }

        type Query {
            user: User
            users: [User]
        }
    `);

    const createMockInfo = (query: string): GraphQLResolveInfo => {
        const document = parse(query);
        const operation = document.definitions[0] as any;
        const fieldNode = operation.selectionSet.selections[0] as FieldNode;

        return {
            fieldName: fieldNode.name.value,
            fieldNodes: [fieldNode],
            returnType: schema.getType('User') as any,
            parentType: schema.getType('Query') as any,
            path: { prev: undefined, key: fieldNode.name.value, typename: 'Query' },
            schema,
            fragments: {},
            rootValue: {},
            operation,
            variableValues: {},
        } as GraphQLResolveInfo;
    };

    describe('getRequestedFields', () => {
        it('should return flat fields structure', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                        name
                        email
                    }
                }
            `);

            const fields = GraphQLFieldHelper.getRequestedFields(mockInfo);

            expect(fields).toEqual({
                id: {},
                name: {},
                email: {},
            });
        });

        it('should return nested fields structure', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                        profile {
                            avatar
                            bio
                        }
                        settings {
                            theme
                            language
                        }
                    }
                }
            `);

            const fields = GraphQLFieldHelper.getRequestedFields(mockInfo);

            expect(fields).toEqual({
                id: {},
                profile: {
                    avatar: {},
                    bio: {},
                },
                settings: {
                    theme: {},
                    language: {},
                },
            });
        });
    });

    describe('isFieldRequested', () => {
        it('should return true for requested top-level field', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                        name
                        email
                    }
                }
            `);

            expect(GraphQLFieldHelper.isFieldRequested(mockInfo, 'id')).toBe(true);
            expect(GraphQLFieldHelper.isFieldRequested(mockInfo, 'name')).toBe(true);
            expect(GraphQLFieldHelper.isFieldRequested(mockInfo, 'email')).toBe(true);
        });

        it('should return false for non-requested field', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                        name
                    }
                }
            `);

            expect(GraphQLFieldHelper.isFieldRequested(mockInfo, 'email')).toBe(false);
            expect(GraphQLFieldHelper.isFieldRequested(mockInfo, 'profile')).toBe(false);
        });

        it('should handle nested field paths', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        profile {
                            avatar
                        }
                    }
                }
            `);

            expect(GraphQLFieldHelper.isFieldRequested(mockInfo, 'profile')).toBe(true);
            expect(GraphQLFieldHelper.isFieldRequested(mockInfo, 'profile.avatar')).toBe(true);
            expect(GraphQLFieldHelper.isFieldRequested(mockInfo, 'profile.bio')).toBe(false);
            expect(GraphQLFieldHelper.isFieldRequested(mockInfo, 'settings')).toBe(false);
        });
    });

    describe('getRequestedFieldsList', () => {
        it('should return list of top-level field names', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                        name
                        email
                        profile {
                            avatar
                        }
                    }
                }
            `);

            const fieldsList = GraphQLFieldHelper.getRequestedFieldsList(mockInfo);

            expect(fieldsList).toEqual(['id', 'name', 'email', 'profile']);
        });

        it('should return empty array for no fields', () => {
            const mockInfo = createMockInfo(`
                query {
                    user
                }
            `);

            const fieldsList = GraphQLFieldHelper.getRequestedFieldsList(mockInfo);

            expect(fieldsList).toEqual([]);
        });
    });

    describe('hasNestedFields', () => {
        it('should return true when field has nested selections', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        profile {
                            avatar
                            bio
                        }
                    }
                }
            `);

            expect(GraphQLFieldHelper.hasNestedFields(mockInfo, 'profile')).toBe(true);
        });

        it('should return false when field has no nested selections', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                        name
                    }
                }
            `);

            expect(GraphQLFieldHelper.hasNestedFields(mockInfo, 'id')).toBe(false);
            expect(GraphQLFieldHelper.hasNestedFields(mockInfo, 'name')).toBe(false);
        });

        it('should return false for non-existent field', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                    }
                }
            `);

            expect(GraphQLFieldHelper.hasNestedFields(mockInfo, 'profile')).toBe(false);
        });
    });

    describe('getNestedFields', () => {
        it('should return nested fields object', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        profile {
                            avatar
                            bio
                        }
                    }
                }
            `);

            const nestedFields = GraphQLFieldHelper.getNestedFields(mockInfo, 'profile');

            expect(nestedFields).toEqual({
                avatar: {},
                bio: {},
            });
        });

        it('should return null for field without nested selections', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                        name
                    }
                }
            `);

            expect(GraphQLFieldHelper.getNestedFields(mockInfo, 'id')).toBeNull();
            expect(GraphQLFieldHelper.getNestedFields(mockInfo, 'name')).toBeNull();
        });

        it('should return null for non-existent field', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                    }
                }
            `);

            expect(GraphQLFieldHelper.getNestedFields(mockInfo, 'profile')).toBeNull();
        });
    });

    describe('shouldFetchRelation', () => {
        it('should return true when relation is requested with nested fields', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        profile {
                            avatar
                        }
                        posts {
                            title
                            content
                        }
                    }
                }
            `);

            expect(GraphQLFieldHelper.shouldFetchRelation(mockInfo, 'profile')).toBe(true);
            expect(GraphQLFieldHelper.shouldFetchRelation(mockInfo, 'posts')).toBe(true);
        });

        it('should return false when relation has no nested fields', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                        name
                    }
                }
            `);

            expect(GraphQLFieldHelper.shouldFetchRelation(mockInfo, 'id')).toBe(false);
            expect(GraphQLFieldHelper.shouldFetchRelation(mockInfo, 'name')).toBe(false);
        });

        it('should return false when relation is not requested', () => {
            const mockInfo = createMockInfo(`
                query {
                    user {
                        id
                        name
                    }
                }
            `);

            expect(GraphQLFieldHelper.shouldFetchRelation(mockInfo, 'profile')).toBe(false);
            expect(GraphQLFieldHelper.shouldFetchRelation(mockInfo, 'posts')).toBe(false);
        });
    });
});
