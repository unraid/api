import type {
    ApiKey as GeneratedApiKey,
    ApiKeyWithSecret as GeneratedApiKeyWithSecret,
} from '@app/graphql/generated/api/types.js';
import { ApiKey, ApiKeyWithSecret } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';

export function mapGeneratedApiKeyToModel(generatedApiKey: GeneratedApiKey): ApiKey {
    return {
        id: generatedApiKey.id,
        name: generatedApiKey.name,
        description: generatedApiKey.description ?? undefined,
        roles: generatedApiKey.roles,
        createdAt: generatedApiKey.createdAt,
        permissions: generatedApiKey.permissions,
    };
}

export function mapGeneratedApiKeyWithSecretToModel(
    generatedApiKey: GeneratedApiKeyWithSecret
): ApiKeyWithSecret {
    return {
        ...mapGeneratedApiKeyToModel(generatedApiKey),
        key: generatedApiKey.key,
    };
}
