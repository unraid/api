import { graphql } from '~/composables/gql/gql';

export const SET_THEME_MUTATION = graphql(/* GraphQL */ `
  mutation setTheme($theme: ThemeName!) {
    customization {
      setTheme(theme: $theme) {
        name
        showBannerImage
        showBannerGradient
        headerBackgroundColor
        showHeaderDescription
        headerPrimaryTextColor
        headerSecondaryTextColor
      }
    }
  }
`);
