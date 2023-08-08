import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';

export interface UserProfileLink {
  click?: any; // @todo be more specific
  disabled?: boolean;
  emphasize?: boolean;
  external?: boolean;
  href?: string;
  icon?: typeof ArrowTopRightOnSquareIcon;
  name?: string;
  text: string;
  title?: string;
}

export interface UserProfilePromoFeature {
  copy: string;
  icon?: typeof ArrowTopRightOnSquareIcon;
  title: string;
}
