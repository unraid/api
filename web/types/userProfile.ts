import type { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';

export interface UserProfileLink {
  click?: () => void | Promise<void>;
  clickParams?: string[] | number[];
  disabled?: boolean;
  emphasize?: boolean;
  external?: boolean;
  href?: string;
  icon?: typeof ArrowTopRightOnSquareIcon;
  name?: string;
  text: string;
  textParams?: string[] | number[];
  title?: string;
}

export interface UserProfilePromoFeature {
  copy: string;
  icon?: typeof ArrowTopRightOnSquareIcon;
  title: string;
}
