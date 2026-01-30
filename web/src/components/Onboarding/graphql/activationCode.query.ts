import { graphql } from '~/composables/gql/gql';

export const PARTNER_INFO_QUERY = graphql(/* GraphQL */ `
  query PartnerInfo {
    publicPartnerInfo {
      partner {
        name
        url
        hardwareSpecsUrl
        manualUrl
        supportUrl
        extraLinks {
          title
          url
        }
      }
      branding {
        hasPartnerLogo
        logoUrl
      }
    }
  }
`);

export const PUBLIC_WELCOME_DATA_QUERY = graphql(/* GraphQL */ `
  query PublicWelcomeData {
    publicPartnerInfo {
      partner {
        name
        url
        hardwareSpecsUrl
        manualUrl
        supportUrl
        extraLinks {
          title
          url
        }
      }
      branding {
        hasPartnerLogo
        logoUrl
      }
    }
    isFreshInstall
  }
`);

export const ACTIVATION_CODE_QUERY = graphql(/* GraphQL */ `
  query ActivationCode {
    customization {
      activationCode {
        code
        partner {
          name
          url
          hardwareSpecsUrl
          manualUrl
          supportUrl
          extraLinks {
            title
            url
          }
        }
        branding {
          header
          headermetacolor
          background
          showBannerGradient
          theme
          logoUrl
          hasPartnerLogo
        }
        system {
          serverName
          model
          comment
        }
      }
      partnerInfo {
        partner {
          name
          url
          hardwareSpecsUrl
          manualUrl
          supportUrl
          extraLinks {
            title
            url
          }
        }
        branding {
          hasPartnerLogo
          logoUrl
        }
      }
      onboardingState {
        registrationState
        isRegistered
        isFreshInstall
        hasActivationCode
        activationRequired
      }
    }
  }
`);
