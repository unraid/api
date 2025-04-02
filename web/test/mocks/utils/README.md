# Vue Component Testing Utilities

This directory contains utilities to help test Vue components, particularly those that use the composition API which can be challenging to test directly.

## The Challenge

Vue components that use the composition API (`setup()`, `computed()`, `ref()`, etc.) can be difficult to test for several reasons:

1. **Composition API mocking issues** - It's difficult to mock the composition API functions like `computed()` and `ref()` in a TypeScript-safe way.
2. **Store integration** - Components that use Pinia stores are tricky to test because of how the stores are injected.
3. **TypeScript errors** - Attempting to directly test components that use the composition API can lead to TypeScript errors like "computed is not defined".

## The Solution: Component Mocking Pattern

Instead of directly testing the component with all its complexity, we create a simplified mock component that implements the same business logic and interface. This approach:

1. **Focuses on behavior** - Tests what the component actually does, not how it's implemented.
2. **Avoids composition API issues** - By using the Options API for the mock component.
3. **Maintains type safety** - Keeps all TypeScript types intact.
4. **Simplifies test setup** - Makes tests cleaner and more focused.

## Available Utilities

### `createMockComponent`

A generic utility for creating mock components:

```typescript
function createMockComponent<Props, Data>(template: string, logicFn: (props: Props) => Data);
```

### `createListComponentMockFactory`

A specialized utility for creating mock component factories for list components with filtering:

```typescript
function createListComponentMockFactory<ItemType, FilterOptions>(
  templateFn: (options: {
    filteredItems: ItemType[] | undefined;
    maxWidth?: boolean;
    t: (key: string) => string;
  }) => string,
  getItemKey: (item: ItemType) => string
);
```

## Usage Examples

See the `examples` directory for complete examples of how to use these utilities:

- `key-actions-mock.ts` - Shows how to create a factory for the KeyActions component
- `KeyActions.test.example.ts` - Shows how to use the factory in actual tests

## When to Use This Approach

This approach is ideal for:

1. Components with complex computed properties
2. Components that integrate with Pinia stores
3. Components with conditional rendering logic
4. Components that need to be thoroughly tested with different prop combinations

## Implementation Notes

The one tradeoff with this approach is that you need to keep the mock implementation in sync with the actual component's logic if the component changes. However, this is generally outweighed by the benefits of having reliable, maintainable tests.

## Contributing

If you encounter a component that doesn't work well with this pattern, please consider extending these utilities or creating a new utility that addresses the specific challenge.
