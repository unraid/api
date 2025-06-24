import baseConfig from '../tailwind.config';

export default {
  ...baseConfig,
  content: [
    '../src/components/**/*.{js,vue,ts}',
    '../src/components/**/*.ce.{js,vue,ts}',
    '../src/composables/**/*.{js,vue,ts}',
    '../stories/**/*.stories.{js,ts,jsx,tsx,mdx}',
    '../src/styles/**/*.css',
  ],
  safelist: [
    // Add commonly used theme classes to safelist to ensure they're generated
    'bg-background',
    'text-foreground',
    'border-border',
    'bg-card',
    'text-card-foreground',
    'bg-primary',
    'text-primary-foreground',
    'bg-secondary',
    'text-secondary-foreground',
    'bg-muted',
    'text-muted-foreground',
    'bg-accent',
    'text-accent-foreground',
    'bg-destructive',
    'text-destructive-foreground',
    ...(baseConfig.safelist || []),
  ],
};
