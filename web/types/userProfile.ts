import type { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';

// type the click key in the UserProfileLink interface to allow for optional params
// the click key can be a function that returns void or a promise that returns void

export type UserProfileLinkClickParams = string[] | number[] | undefined;
export type UserProfileLinkClick =
  | ((...args: UserProfileLinkClickParams[]) => void | Promise<void>)
  | ((...args: UserProfileLinkClickParams[]) => Promise<NodeJS.Timeout | undefined>);

export interface UserProfileLink {
  click?: UserProfileLinkClick;
  clickParams?: UserProfileLinkClickParams;
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
