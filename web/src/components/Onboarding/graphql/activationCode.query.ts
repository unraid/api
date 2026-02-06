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
        onboardingTitle
        onboardingSubtitle
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
        onboardingTitle
        onboardingSubtitle
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
          onboardingTitle
          onboardingSubtitle
        }
        system {
          serverName
          model
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
          onboardingTitle
          onboardingSubtitle
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
