import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';

export interface UserProfileLink {
  emphasize?: boolean;
  external?: boolean;
  href: string;
  icon?: typeof ArrowTopRightOnSquareIcon;
  text: string;
  title?: string;
}
