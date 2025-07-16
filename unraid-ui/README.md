# Unraid UI

A Vue 3 component library providing a set of reusable, accessible UI components for Unraid development.

## Features

- ⚡️ Built with Vue 3 and TypeScript
- 🎭 Storybook documentation
- ✅ Tested components
- 🎪 Built on top of TailwindCSS and Shadcn/UI

## Installation

Make sure you have the peer dependencies installed:

```bash
npm install vue@^3.3.0 tailwindcss@^3.0.0
```

## Setup

### 1. Add CSS

Import the component library styles in your main entry file:

```typescript
import '@unraid/ui/style.css';
```

### 2. Configure TailwindCSS

Create a `tailwind.config.ts` file with the following configuration:

```typescript
import tailwindConfig from '@unraid/ui/tailwind.config.ts';
import type { Config } from 'tailwindcss';

export default {
  presets: [tailwindConfig],
  content: [
    // ... your content paths
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
  ],
  theme: {
    extend: {
      // your theme extensions
    },
  },
} satisfies Partial<Config>;
```

This configuration:

- Uses the Unraid UI library's Tailwind config as a preset
- Properly types your configuration with TypeScript
- Allows you to extend the base theme while maintaining all Unraid UI defaults

## Usage

```vue
<script setup lang="ts">
import { Button } from '@unraid/ui';
</script>

<template>
  <Button variant="primary"> Click me </Button>
</template>
```

## Development

### Local Development

Install dependencies:

```bash
npm install
```

Start Storybook development server:

```bash
npm run storybook
```

This will start Storybook at [http://localhost:6006](http://localhost:6006)

### Building

```bash
npm run build
```

### Testing

Run tests:

```bash
npm run test
```

Run tests with UI:

```bash
npm run test:ui
```

Generate coverage report:

```bash
npm run coverage
```

### Type Checking

```bash
npm run typecheck
```

## Scripts

- `dev`: Start development server
- `build`: Build for production
- `preview`: Preview production build
- `test`: Run tests
- `test:ui`: Run tests with UI
- `coverage`: Generate test coverage
- `clean`: Remove build artifacts
- `typecheck`: Run type checking
- `storybook`: Start Storybook development server
- `build-storybook`: Build Storybook for production

## License

## Component Development

### Installing Shadcn Components

1. Install a new component using the Shadcn CLI:

```bash
npx shadcn-vue@latest add [component-name]
```

2. The component will be installed in the root components folder. Move it to the appropriate subfolder based on its type:

   - Form components → `src/components/form/`
   - Layout components → `src/components/layout/`
   - Common components → `src/components/common/`
   - Brand components → `src/components/brand/`

3. Update any imports in your codebase to reflect the new component location.

### Component Variants Pattern

We use the `class-variance-authority` (CVA) package to manage component variants. Each component that supports variants should follow this pattern:

1. Create a variants file (e.g., `button.variants.ts`):

```typescript
import { cva } from 'class-variance-authority';

export const buttonVariants = cva('base-classes-here', {
  variants: {
    variant: {
      primary: 'variant-specific-classes',
      secondary: 'variant-specific-classes',
      // ... other variants
    },
    size: {
      sm: 'size-specific-classes',
      md: 'size-specific-classes',
      lg: 'size-specific-classes',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});
```

2. Use the variants in your component (e.g., `Button.vue`):

```vue
<script setup lang="ts">



import { computed } from "vue";
import { buttonVariants } from "./button.variants";
import { cn } from "@/lib/utils";

export interface ButtonProps {
  variant?: "primary" | "secondary" | /* other variants */;
  size?: "sm" | "md" | "lg";
  class?: string;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: "primary",
  size: "md",
});

const buttonClass = computed(() => {
  return cn(
    buttonVariants({ variant: props.variant, size: props.size }),
    props.class
  );
});
</script>

<template>
  <button :class="buttonClass">
    <slot />
  </button>
</template>
```

### Storybook Development

We use Storybook for component development and documentation. To start the Storybook development server:

```bash
npm run storybook
```

This will start Storybook at [http://localhost:6006](http://localhost:6006)

When creating stories for your components:

1. Place story files in the `stories` directory
2. Name your story files as `ComponentName.stories.ts`
3. Include examples of all variants and states
4. Add documentation using JSDoc comments

Example story file:

```typescript
import type { Meta, StoryObj } from '@storybook/vue3';
import { Button } from '../src/components/common/button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline-solid'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
  },
};
```
