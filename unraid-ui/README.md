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
import "@unraid/ui/style.css";
```

### 2. Configure TailwindCSS

Add the following to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    // ... your content paths
    "./node_modules/@unraid/ui/**/*.{js,vue,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
```

## Usage

```vue
<script setup lang="ts">
import { Button } from "@unraid/ui";
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
