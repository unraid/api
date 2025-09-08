# Feature Flags

Feature flags allow you to conditionally enable or disable functionality in the Unraid API. This is useful for gradually rolling out new features, A/B testing, or keeping experimental code behind flags during development.

## Setting Up Feature Flags

### 1. Define the Feature Flag

Feature flags are defined as environment variables and collected in `src/consts.ts`:

```typescript
// src/environment.ts
export const ENABLE_MY_NEW_FEATURE = process.env.ENABLE_MY_NEW_FEATURE === 'true';

// src/consts.ts
export const FeatureFlags = Object.freeze({
    ENABLE_NEXT_DOCKER_RELEASE,
    ENABLE_MY_NEW_FEATURE, // Add your new flag here
});
```

### 2. Set the Environment Variable

Set the environment variable when running the API:

```bash
ENABLE_MY_NEW_FEATURE=true unraid-api start
```

Or add it to your `.env` file:

```env
ENABLE_MY_NEW_FEATURE=true
```

## Using Feature Flags in GraphQL

### Method 1: @UseFeatureFlag Decorator (Schema-Level)

The `@UseFeatureFlag` decorator conditionally includes or excludes GraphQL fields, queries, and mutations from the schema based on feature flags. When a feature flag is disabled, the field won't appear in the GraphQL schema at all.

```typescript
import { UseFeatureFlag } from '@app/unraid-api/decorators/use-feature-flag.decorator.js';
import { Query, Mutation, ResolveField } from '@nestjs/graphql';

@Resolver()
export class MyResolver {
    
    // Conditionally include a query
    @UseFeatureFlag('ENABLE_MY_NEW_FEATURE')
    @Query(() => String)
    async experimentalQuery() {
        return 'This query only exists when ENABLE_MY_NEW_FEATURE is true';
    }
    
    // Conditionally include a mutation
    @UseFeatureFlag('ENABLE_MY_NEW_FEATURE')
    @Mutation(() => Boolean)
    async experimentalMutation() {
        return true;
    }
    
    // Conditionally include a field resolver
    @UseFeatureFlag('ENABLE_MY_NEW_FEATURE')
    @ResolveField(() => String)
    async experimentalField() {
        return 'This field only exists when the flag is enabled';
    }
}
```

**Benefits:**
- Clean schema - disabled features don't appear in GraphQL introspection
- No runtime overhead for disabled features
- Clear feature boundaries

**Use when:**
- You want to completely hide features from the GraphQL schema
- The feature is experimental or in beta
- You're doing a gradual rollout

### Method 2: checkFeatureFlag Function (Runtime)

The `checkFeatureFlag` function provides runtime feature flag checking within resolver methods. It throws a `ForbiddenException` if the feature is disabled.

```typescript
import { checkFeatureFlag } from '@app/unraid-api/utils/feature-flag.helper.js';
import { FeatureFlags } from '@app/consts.js';
import { Query, ResolveField } from '@nestjs/graphql';

@Resolver()
export class MyResolver {
    
    @Query(() => String)
    async myQuery(
        @Args('useNewAlgorithm', { nullable: true }) useNewAlgorithm?: boolean
    ) {
        // Conditionally use new logic based on feature flag
        if (useNewAlgorithm) {
            checkFeatureFlag(FeatureFlags, 'ENABLE_MY_NEW_FEATURE');
            return this.newAlgorithm();
        }
        
        return this.oldAlgorithm();
    }
    
    @ResolveField(() => String)
    async dataField() {
        // Check flag at the start of the method
        checkFeatureFlag(FeatureFlags, 'ENABLE_MY_NEW_FEATURE');
        
        // Feature-specific logic here
        return this.computeExperimentalData();
    }
}
```

**Benefits:**
- More granular control within methods
- Can conditionally execute parts of a method
- Useful for A/B testing scenarios
- Good for gradual migration strategies

**Use when:**
- You need conditional logic within a method
- The field should exist but behavior changes based on the flag
- You're migrating from old to new implementation gradually

## Feature Flag Patterns

### Pattern 1: Complete Feature Toggle

Hide an entire feature behind a flag:

```typescript
@UseFeatureFlag('ENABLE_DOCKER_TEMPLATES')
@Resolver(() => DockerTemplate)
export class DockerTemplateResolver {
    // All resolvers in this class are toggled by the flag
}
```

### Pattern 2: Gradual Migration

Migrate from old to new implementation:

```typescript
@Query(() => [Container])
async getContainers(@Args('version') version?: string) {
    if (version === 'v2') {
        checkFeatureFlag(FeatureFlags, 'ENABLE_CONTAINERS_V2');
        return this.getContainersV2();
    }
    
    return this.getContainersV1();
}
```

### Pattern 3: Beta Features

Mark features as beta:

```typescript
@UseFeatureFlag('ENABLE_BETA_FEATURES')
@ResolveField(() => BetaMetrics, { 
    description: 'BETA: Advanced metrics (requires ENABLE_BETA_FEATURES flag)' 
})
async betaMetrics() {
    return this.computeBetaMetrics();
}
```

### Pattern 4: Performance Optimizations

Toggle expensive operations:

```typescript
@ResolveField(() => Statistics)
async statistics() {
    const basicStats = await this.getBasicStats();
    
    try {
        checkFeatureFlag(FeatureFlags, 'ENABLE_ADVANCED_ANALYTICS');
        const advancedStats = await this.getAdvancedStats();
        return { ...basicStats, ...advancedStats };
    } catch {
        // Feature disabled, return only basic stats
        return basicStats;
    }
}
```

## Testing with Feature Flags

When writing tests for feature-flagged code, create a mock to control feature flag values:

```typescript
import { vi } from 'vitest';

// Mock the entire consts module
vi.mock('@app/consts.js', async () => {
    const actual = await vi.importActual('@app/consts.js');
    return {
        ...actual,
        FeatureFlags: {
            ENABLE_MY_NEW_FEATURE: true, // Set your test value
            ENABLE_NEXT_DOCKER_RELEASE: false,
        }
    };
});

describe('MyResolver', () => {
    it('should execute new logic when feature is enabled', async () => {
        // Test new behavior with mocked flag
    });
});
```

## Best Practices

1. **Naming Convention**: Use `ENABLE_` prefix for boolean feature flags
2. **Environment Variables**: Always use uppercase with underscores
3. **Documentation**: Document what each feature flag controls
4. **Cleanup**: Remove feature flags once features are stable and fully rolled out
5. **Default State**: New features should default to `false` (disabled)
6. **Granularity**: Keep feature flags focused on a single feature or capability
7. **Testing**: Always test both enabled and disabled states

## Common Use Cases

- **Experimental Features**: Hide unstable features in production
- **Gradual Rollouts**: Enable features for specific environments first
- **A/B Testing**: Toggle between different implementations
- **Performance**: Disable expensive operations when not needed
- **Breaking Changes**: Provide migration path with both old and new behavior
- **Debug Features**: Enable additional logging or debugging tools

## Checking Active Feature Flags

To see which feature flags are currently active:

```typescript
// Log all feature flags on startup
console.log('Active Feature Flags:', FeatureFlags);
```

Or check via GraphQL introspection to see which fields are available based on current flags.
