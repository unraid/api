import { parse } from 'graphql';

export const PARTNER_INFO_QUERY = parse(/* GraphQL */ `
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
        partnerLogoLightUrl
        partnerLogoDarkUrl
        onboardingTitle
        onboardingSubtitle
      }
    }
  }
`);

export const PUBLIC_WELCOME_DATA_QUERY = parse(/* GraphQL */ `
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
        partnerLogoLightUrl
        partnerLogoDarkUrl
        onboardingTitle
        onboardingSubtitle
      }
    }
    isFreshInstall
  }
`);

export const ACTIVATION_CODE_QUERY = parse(/* GraphQL */ `
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
          partnerLogoLightUrl
          partnerLogoDarkUrl
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
          partnerLogoLightUrl
          partnerLogoDarkUrl
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
