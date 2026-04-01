import { graphql } from '~/composables/gql/gql.js';

export const ONBOARDING_BOOTSTRAP_QUERY = graphql(/* GraphQL */ `
  query OnboardingBootstrap {
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
          bannerImage
          caseModel
          caseModelImage
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
        status
        isPartnerBuild
        completed
        completedAtVersion
        shouldOpen
        onboardingState {
          registrationState
          isRegistered
          isFreshInstall
          hasActivationCode
          activationRequired
        }
        wizard {
          currentStepId
          visibleStepIds
          draft
          internalBootState {
            applyAttempted
            applySucceeded
          }
        }
      }
    }
  }
`);
