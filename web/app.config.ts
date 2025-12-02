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
  },
  toaster: {
    position: 'bottom-right' as const,
    expand: true,
    duration: 5000,
  },
};
