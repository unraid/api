export default {
  ui: {
    colors: {
      // overrided by tailwind-shared/css-variables.css
      // these shared tailwind styles and colors are imported in src/assets/main.css
    },

    // https://ui.nuxt.com/docs/components/button#theme
    button: {
      //keep in mind, there is a "variant" AND a "variants" property
      variants: {
        variant: {
          ghost: '',
          link: 'hover:underline focus:underline',
        },
      },
    },

    // https://ui.nuxt.com/docs/components/tabs#theme
    tabs: {
      variants: {
        pill: {},
      },
    },

    // https://ui.nuxt.com/docs/components/slideover#theme
    slideover: {
      slots: {
        // title: 'text-3xl font-normal',
      },
      variants: {
        right: {},
      },
    },

    //css theming/style-overrides for the toast component
    // https://ui.nuxt.com/docs/components/toast#theme
    toast: {},

    // Also, for toasts, BUT this is imported in the Root UApp in mount-engine.ts
    // https://ui.nuxt.com/docs/components/toast#examples
    toaster: {
      position: 'top-center' as const,
      // expand: false, --> buggy
      duration: 5000,
      // max: 3, --> not added yet in 4.0.0-alpha.0. Needs to be upgraded to 4.2.1 or later.
    },
  },
};
