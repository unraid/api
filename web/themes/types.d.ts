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
