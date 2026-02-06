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
        onboardingTitleFreshInstall
        onboardingSubtitleFreshInstall
        onboardingTitleUpgrade
        onboardingSubtitleUpgrade
        onboardingTitleDowngrade
        onboardingSubtitleDowngrade
        onboardingTitleIncomplete
        onboardingSubtitleIncomplete
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
        onboardingTitleFreshInstall
        onboardingSubtitleFreshInstall
        onboardingTitleUpgrade
        onboardingSubtitleUpgrade
        onboardingTitleDowngrade
        onboardingSubtitleDowngrade
        onboardingTitleIncomplete
        onboardingSubtitleIncomplete
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
          onboardingTitleFreshInstall
          onboardingSubtitleFreshInstall
          onboardingTitleUpgrade
          onboardingSubtitleUpgrade
          onboardingTitleDowngrade
          onboardingSubtitleDowngrade
          onboardingTitleIncomplete
          onboardingSubtitleIncomplete
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
          onboardingTitleFreshInstall
          onboardingSubtitleFreshInstall
          onboardingTitleUpgrade
          onboardingSubtitleUpgrade
          onboardingTitleDowngrade
          onboardingSubtitleDowngrade
          onboardingTitleIncomplete
          onboardingSubtitleIncomplete
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
