import type { LegacyThemeVariables, ThemeVariables } from '~/themes/types';

/**
 * Defines legacy colors that are kept for backwards compatibility
 *
 * Allows theme-engine to be updated without breaking existing themes
 */
export const legacyColors = {
  '--color-alpha': 'var(--header-background-color)',
  '--color-beta': 'var(--header-text-primary)',
  '--color-gamma': 'var(--header-text-secondary)',
  '--color-gamma-opaque': 'rgba(153, 153, 153, .5)',
  '--color-customgradient-start': 'rgba(242, 242, 242, .0)',
  '--color-customgradient-end': 'rgba(242, 242, 242, .85)',
  '--shadow-beta': '0 25px 50px -12px rgba(242, 242, 242, .15)',
} as const satisfies LegacyThemeVariables;

export const defaultLight: ThemeVariables = {
  '--background': '0 0% 3.9%',
  '--foreground': '0 0% 98%',
  '--muted': '0 0% 14.9%',
  '--muted-foreground': '0 0% 63.9%',
  '--popover': '0 0% 3.9%',
  '--popover-foreground': '0 0% 98%',
  '--card': '0 0% 14.9%',
  '--card-foreground': '0 0% 98%',
  '--border': '0 0% 20%',
  '--input': '0 0% 14.9%',
  '--primary': '24 100% 50%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '0 0% 14.9%',
  '--secondary-foreground': '0 0% 77%',
  '--accent': '0 0% 14.9%',
  '--accent-foreground': '0 0% 98%',
  '--destructive': '0 62.8% 30.6%',
  '--destructive-foreground': '0 0% 98%',
  '--ring': '0 0% 83.1%',
  '--radius': '0.5rem',
  '--header-text-primary': '#f2f2f2',
  '--header-text-secondary': '#999999',
  '--header-background-color': '#1c1b1b',
  '--header-gradient-start': 'rgba(0, 0, 0, 0)',
  '--header-gradient-end': 'var(--header-background-color)',
  '--banner-gradient': null,
  ...legacyColors,
} as const satisfies ThemeVariables;

export const defaultDark: ThemeVariables = {
  '--background': '0 0% 100%',
  '--foreground': '0 0% 3.9%',
  '--muted': '0 0% 96.1%',
  '--muted-foreground': '0 0% 45.1%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '0 0% 3.9%',
  '--card': '0 0% 100%',
  '--card-foreground': '0 0% 3.9%',
  '--border': '0 0% 89.8%',
  '--input': '0 0% 89.8%',
  '--primary': '24 100% 50%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '0 0% 96.1%',
  '--secondary-foreground': '0 0% 45%',
  '--accent': '0 0% 96.1%',
  '--accent-foreground': '0 0% 9%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '0 0% 98%',
  '--ring': '0 0% 3.9%',
  '--radius': '0.5rem',
  '--header-text-primary': '#1c1c1c',
  '--header-text-secondary': '#999999',
  '--header-background-color': '#f2f2f2',
  '--header-gradient-start': 'rgba(0, 0, 0, 0)',
  '--header-gradient-end': 'var(--header-background-color)',
  '--banner-gradient': null,
  ...legacyColors,
} as const satisfies ThemeVariables;

/**
 * Color Explanation:
 * White (base light theme): has dark header background and light text
 * Black (base dark theme): has light header background and dark text
 * Gray (base dark theme): has dark header background and light text
 * Azure (base light theme): has light header background and dark text
 */
export const defaultColors: Record<string, ThemeVariables> = {
  white: {
    ...defaultLight,
  },
  black: {
    ...defaultDark,
  },
  gray: {
    ...defaultDark,
    '--header-text-primary': '#39587f',
    '--header-text-secondary': '#606e7f',
    '--header-background-color': '#1c1b1b',
  },
  azure: {
    ...defaultDark,
    '--header-text-primary': '#39587f',
    '--header-text-secondary': '#606e7f',
    '--header-background-color': '#f2f2f2',
  },
} as const satisfies Record<string, ThemeVariables>;
