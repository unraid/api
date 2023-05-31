import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';

export interface UserProfileLink {
  click?: any; // @todo be more specific
  emphasize?: boolean;
  external?: boolean;
  href?: string;
  icon?: typeof ArrowTopRightOnSquareIcon;
  name?: string;
  text: string;
  title?: string;
}
