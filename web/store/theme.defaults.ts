export interface Theme {
  banner: boolean;
  bannerGradient: boolean;
  bgColor: string;
  descriptionShow: boolean;
  metaColor: string;
  name: string;
  textColor: string;
}

type BaseThemeVariables = {
  '--background': string;
  '--foreground': string;
  '--muted': string;
  '--muted-foreground': string;
  '--popover': string;
  '--popover-foreground': string;
  '--card': string;
  '--card-foreground': string;
  '--border': string;
  '--input': string;
  '--primary': string;
  '--primary-foreground': string;
  '--secondary': string;
  '--secondary-foreground': string;
  '--accent': string;
  '--accent-foreground': string;
  '--destructive': string;
  '--destructive-foreground': string;
  '--ring': string;
  '--radius': string;
  '--header-text-primary': string;
  '--header-text-secondary': string;
  '--header-background-color': string;
  '--header-gradient-start': string;
  '--header-gradient-end': string;
  '--banner-gradient': string | null;
};

type LegacyThemeVariables = {
  '--color-alpha': string;
  '--color-beta': string;
  '--color-gamma': string;
  '--color-gamma-opaque': string;
  '--color-customgradient-start': string;
  '--color-customgradient-end': string;
  '--shadow-beta': string;
};

export type ThemeVariables = BaseThemeVariables & LegacyThemeVariables;

/**
 * Defines legacy colors that are kept for backwards compatibility
 *
 * Allows theme-engine to be updated without breaking existing themes
 */
export const legacyColors: LegacyThemeVariables = {
  '--color-alpha': 'var(--header-background-color)',
  '--color-beta': 'var(--header-text-primary)',
  '--color-gamma': 'var(--header-text-secondary)',
  '--color-gamma-opaque': 'rgba(153, 153, 153, .5)',
  '--color-customgradient-start': 'rgba(242, 242, 242, .0)',
  '--color-customgradient-end': 'rgba(242, 242, 242, .85)',
  '--shadow-beta': '0 25px 50px -12px rgba(242, 242, 242, .15)',
};

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
} as const;

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
} as const;
