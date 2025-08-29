// UI configuration for @nuxt/ui in Vue mode
// This replaces the auto-generated .nuxt/ui configuration

export const colors = {
  primary: 'green',
  gray: 'slate'
};

export const strategy = 'merge';

export const theme = {
  colors: ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'],
};

export const icons = {
  dynamic: true,
  heroicons: {
    solid: () => import('@heroicons/vue/24/solid'),
    outline: () => import('@heroicons/vue/24/outline'),
    mini: () => import('@heroicons/vue/20/solid'),
  },
  lucide: () => import('lucide-vue-next'),
};

export const shortcuts = {};

export const notifications = {
  position: 'top-0 bottom-auto',
};

export const modal = {
  transition: {
    enter: 'duration-300 ease-out',
    enterFrom: 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95',
    enterTo: 'opacity-100 translate-y-0 sm:scale-100',
    leave: 'duration-200 ease-in',
    leaveFrom: 'opacity-100 translate-y-0 sm:scale-100',
    leaveTo: 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95',
  },
};

export const slideover = {
  transition: {
    enter: 'transform transition ease-in-out duration-300',
    leave: 'transform transition ease-in-out duration-300',
  },
};