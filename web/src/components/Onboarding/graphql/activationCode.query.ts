import { parse } from 'graphql';

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
      onboarding {
        onboardingState {
          registrationState
          isRegistered
          isFreshInstall
          hasActivationCode
          activationRequired
        }
      }
    }
  }
`);
